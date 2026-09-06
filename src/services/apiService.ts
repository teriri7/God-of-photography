export interface ImageGenParams {
  baseUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
  inputImageBase64: string; // "data:image/jpeg;base64,..."
  resolution: string;
  aspectRatio: string;
}

export const apiService = {
  /**
   * 拉取 API 模型列表
   */
  async fetchModels(baseUrl: string, apiKey: string): Promise<string[]> {
    const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
    const endpoint = `${cleanUrl}/v1/models`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`获取模型失败 (${response.status}): ${errText || response.statusText}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.data)) {
      throw new Error('API 返回的数据格式无效，未找到 data 数组');
    }

    // 提取模型 ID 列表并排序（包含 image / gemini / gpt 的排在前面）
    const modelIds: string[] = data.data.map((item: any) => item.id).filter(Boolean);
    
    return modelIds.sort((a, b) => {
      const aIsImg = a.toLowerCase().includes('image') ? -1 : 1;
      const bIsImg = b.toLowerCase().includes('image') ? -1 : 1;
      return aIsImg - bIsImg;
    });
  },

  /**
   * 图生图核心调用
   */
  async generateImageToImage(params: ImageGenParams): Promise<string> {
    const { baseUrl, apiKey, model, prompt, inputImageBase64, resolution, aspectRatio } = params;
    const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
    const cleanKey = apiKey.trim();

    const fullPrompt = `${prompt} [Requirements: Resolution ${resolution}, Aspect Ratio ${aspectRatio}, preserve key subject and enhance composition and aesthetics]. Please output the generated image directly.`;

    // 优先尝试多模态 Chat Completions（NewAPI 的 gemini-*-image / gpt-image-2 普遍规范）
    try {
      const chatEndpoint = `${cleanUrl}/v1/chat/completions`;
      const chatBody = {
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: fullPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: inputImageBase64,
                },
              },
            ],
          },
        ],
      };

      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.error?.message || response.statusText;
        // 如果提示仅支持 imagen，则尝试 images/generations
        if (errMsg.includes('only imagen') || response.status === 404) {
          return await this.fallbackImagesEndpoint(cleanUrl, cleanKey, model, fullPrompt, resolution);
        }
        throw new Error(`生成失败 (${response.status}): ${errMsg}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '';

      // 解析 Markdown / 文本中的图片 URL 或 base64
      const extractedImage = this.extractImageFromContent(content);
      if (extractedImage) {
        return extractedImage;
      }

      throw new Error(`API 响应未检测到图片内容，返回文本为: ${content.slice(0, 200)}...`);
    } catch (err: any) {
      console.warn('Chat completions failed, trying images API fallback...', err);
      // 如果不是由于网络断开等致命原因，尝试降级
      if (err.message && err.message.includes('生成失败')) {
        throw err;
      }
      return await this.fallbackImagesEndpoint(cleanUrl, cleanKey, model, fullPrompt, resolution);
    }
  },

  /**
   * 降级调用 /v1/images/generations
   */
  async fallbackImagesEndpoint(cleanUrl: string, cleanKey: string, model: string, prompt: string, resolution: string): Promise<string> {
    const endpoint = `${cleanUrl}/v1/images/generations`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: resolution.includes('1024') ? '1024x1024' : '512x512',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`生成接口错误 (${response.status}): ${errText}`);
    }

    const data = await response.json();
    if (data.data && data.data[0]) {
      if (data.data[0].b64_json) {
        return `data:image/png;base64,${data.data[0].b64_json}`;
      }
      if (data.data[0].url) {
        return data.data[0].url;
      }
    }

    throw new Error('未在生成接口响应中找到图片数据');
  },

  /**
   * 智能提取 markdown / html / 裸链接 / base64 图片
   */
  extractImageFromContent(content: string): string | null {
    if (!content) return null;

    // 1. 匹配 markdown 语法: ![...](...)
    const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s\)]+|data:image\/[a-zA-Z]+;base64,[^\s\)]+)\)/i);
    if (mdMatch && mdMatch[1]) {
      return mdMatch[1];
    }

    // 2. 匹配 html 标签: <img src="..." />
    const imgTagMatch = content.match(/<img[^>]+src=["'](https?:\/\/[^"']+|data:image\/[a-zA-Z]+;base64,[^"']+)["']/i);
    if (imgTagMatch && imgTagMatch[1]) {
      return imgTagMatch[1];
    }

    // 3. 直接匹配 data:image 链接
    const base64Match = content.match(/(data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+)/i);
    if (base64Match && base64Match[1]) {
      return base64Match[1];
    }

    // 4. 直接匹配 http(s) 图片扩展名或 URL
    const urlMatch = content.match(/(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp|gif)(?:\?[^\s"'<>]*)?)/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }

    // 5. 宽松 URL 匹配（如果是以 http 开头的独立行或单词）
    const generalUrlMatch = content.match(/(https?:\/\/[^\s"'<>]+)/i);
    if (generalUrlMatch && generalUrlMatch[1]) {
      return generalUrlMatch[1];
    }

    return null;
  },
};

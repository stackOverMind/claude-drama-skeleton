# AI漫剧创作技术文档
## 智能体调用指南

---

## 📚 目录

1. [文档概述](#文档概述)
2. [AI模型技术栈](#ai模型技术栈)
3. [剧本创作与分镜头脚本](#剧本创作与分镜头脚本)
4. [图片生成提示词](#图片生成提示词)
5. [视频生成提示词](#视频生成提示词)
6. [智能体调用指南](#智能体调用指南)

---

## 文档概述

本文档为AI漫剧创作者提供全面的技术支持，整合了最新的AI大模型能力，涵盖剧本创作、图像生成、视频制作等全流程。基于2026年1月最新评测，包含国内外45+个前沿模型的技术参数和应用技巧。

**文档来源**: 漫屋大模型评测（语雀）
**更新时间**: 2026年1月
**适用场景**: AI漫剧全流程制作

---

## AI模型技术栈

### 🎬 视频生成模型

| 模型名称 | 核心能力 | 最佳应用场景 | 关键参数 |
|---------|---------|------------|---------|
| **Runway Gen 4.5** | 视频大跃升，高质量生成 | 电影级场景、动作捕捉 | 高分辨率、长时长 |
| **VEO 3.1** | 竖屏+4K分辨率支持 | 短视频平台、竖屏剧 | 4K输出、竖屏优化 |
| **Wan 2.6** | 专业分镜控制 | 分镜头制作、专业影视 | 分镜控制、镜头切换 |
| **Qwen Image Edit** | 3D Camera Control | 镜头角度转换、视角变换 | 镜头参数控制 |

### 🎨 图像生成模型

| 模型名称 | 核心能力 | 最佳应用场景 | 关键参数 |
|---------|---------|------------|---------|
| **Flux.2-Klein** | 秒级出图、普通显卡可跑 | 快速迭代、批量生成 | 秒级响应、轻量化 |
| **MJ niji V7** | 动漫画面新突破 | 动漫风格角色场景 | 动漫风格优化 |
| **Qwen-Image** | 多样化风格 | 各种艺术风格 | 风格兼容性强 |
| **Kolors** | 色彩控制 | 色彩丰富的场景 | 色彩精确控制 |
| **Z-Image-Turbo** | 快速生成 | 实时预览、概念设计 | 高速生成 |

### 🎤 TTS语音模型

| 模型名称 | 核心能力 | 最佳应用场景 | 关键参数 |
|---------|---------|------------|---------|
| **Qwen3-TTS** | 声音克隆+设计控制全功能 | 角色配音、情感表达 | 声音克隆、情感控制 |
| **IndexTTS2+infinite talk** | 语音合成+对话型 | 连续对话、交互式内容 | 自然对话流 |

### 🎵 音乐模型

| 模型名称 | 核心能力 | 最佳应用场景 | 关键参数 |
|---------|---------|------------|---------|
| **HeartMuLa** | 开源音乐模型 | BGM、配乐生成 | 开源、音乐风格控制 |

### 🧠 大语言模型

| 模型名称 | 擅长领域 | 最佳应用场景 |
|---------|---------|------------|
| **ChatGPT-5** | 法律领域、通用写作 | 剧本架构、剧情逻辑 |
| **Claude Sonnet 4.5** | 自媒体、教育领域 | 台词创作、教育类漫剧 |
| **Gemini 2.5 pro** | 自媒体、法律领域 | 创意构思、内容策划 |

---

## 剧本创作与分镜头脚本

### 📖 剧本创作规范

#### 1. 剧本结构模板

```markdown
# 剧名：[作品名称]

## 第一幕：开场（15-20%）

### 场次 1
**地点**：[具体场景]
**时间**：[时间段]
**人物**：[角色A]、[角色B]
**氛围**：[紧张/温馨/悬疑等]

[场景描述]
[动作描写]
[对话内容]

**场景时长**：X秒
**转场方式**：[淡入淡出/切镜头/特效转场]

---

## 第二幕：发展（50-60%）
[多个场次...]

## 第三幕：高潮（20-25%）
[核心场次...]

## 第四幕：结局（10-15%）
[结尾场次...]
```

#### 2. 角色设定模板

```markdown
## 角色名称：[名字]

### 基本信息
- 年龄：XX岁
- 性别：男/女
- 职业：[职业]
- 性格关键词：[3-5个形容词]

### 外貌特征
- 身高：XXX cm
- 体型：[体格描述]
- 发型：[发型描述]
- 眼睛：[颜色/形状]
- 着装风格：[服装风格]
- 标志性特征：[疤痕/纹身/饰品等]

### 说话风格
- 语气：[严肃/幽默/温柔等]
- 口头禅：[常用语录]
- 语言特点：[简洁/啰嗦/专业等]

### 情感维度
- 核心动机：[驱动角色的核心欲望]
- 恐惧：[角色害怕的事物]
- 弱点：[角色的短板]
- 成长弧光：[角色变化轨迹]
```

#### 3. 对话写作技巧

**使用ChatGPT-5创作台词时，使用以下提示词模板：**

```
请为[角色名]创作台词，角色背景：
- 性格：[性格描述]
- 场景：[当前情境]
- 对话对象：[对方角色]
- 情感状态：[当前情绪]

要求：
1. 符合角色性格特点
2. 语言自然流畅
3. 包含潜台词
4. 节奏符合场景氛围

场景描述：
[场景详细描述]

请输出3-5句对话，每句标注情感标签。
```

### 🎬 分镜头脚本模板

#### 1. 分镜头格式规范

| 镜号 | 景别 | 角度 | 画面内容 | 声音 | 时长 | 特效/备注 |
|------|------|------|---------|------|------|----------|
| 1 | 远景 | 平视 | 城市全景，夕阳西下 | 环境音+BGM起 | 3s | 淡入 |
| 2 | 中景 | 俯拍 | 主角站在楼顶，背对镜头 | 风声+脚步声 | 5s | 镜头推近 |
| 3 | 近景 | 仰拍 | 主角转身，表情凝重 | 对话开始 | 4s | 切镜头 |

#### 2. 景别与镜头语言

**景别分类：**
- **大远景**：展示环境，建立时空
- **远景**：人物全身+大范围环境
- **全景**：人物全身+部分环境
- **中景**：人物腰部以上
- **近景**：人物胸部以上
- **特写**：面部细节、重要物体
- **大特写**：眼神、手部等极小范围

**镜头角度：**
- **平视**：客观、中立
- **仰拍**：表现力量、压迫感
- **俯拍**：表现弱小、脆弱
- **倾斜**：表现失衡、不安
- **荷兰角**：增强戏剧张力

**镜头运动：**
- **推镜头**：强调主体、情绪深入
- **拉镜头**：展示环境、情绪疏远
- **摇镜头**：跟随运动、展示空间
- **跟镜头**：跟随人物移动
- **移镜头**：平行移动、展示关系

#### 3. 使用Qwen Image Edit进行3D Camera Control

**镜头角度转换提示词模板：**

```python
# 镜头转换示例
camera_control = {
    "from_shot": {
        "type": "中景",
        "angle": "平视",
        "position": "角色正面"
    },
    "to_shot": {
        "type": "近景",
        "angle": "仰拍",
        "position": "角色侧下方"
    },
    "transition": "平滑推镜头",
    "duration": "2秒",
    "focus_target": "角色眼神"
}

# 生成提示词
prompt = f"""
从{camera_control['from_shot']['type']} {camera_control['from_shot']['angle']} 
转换到{camera_control['to_shot']['type']} {camera_control['to_shot']['angle']}
通过{camera_control['transition']}方式，时长{camera_control['duration']}
焦点保持在{camera_control['focus_target']}
"""
```

#### 4. 使用Wan 2.6进行专业分镜控制

**分镜控制参数：**

```json
{
  "shot_sequence": [
    {
      "shot_number": 1,
      "camera_angle": "平视",
      "field_of_view": "中景",
      "movement": "固定镜头",
      "focus_distance": "2.5米",
      "duration": "3秒",
      "transition": {
        "type": "切镜头",
        "effect": "无"
      }
    },
    {
      "shot_number": 2,
      "camera_angle": "仰拍30度",
      "field_of_view": "近景",
      "movement": "缓慢推镜头",
      "focus_distance": "1.5米",
      "duration": "4秒",
      "transition": {
        "type": "溶解",
        "effect": "淡入淡出"
      }
    }
  ]
}
```

---

## 图片生成提示词

### 🖼️ 基础提示词结构

#### 1. 通用提示词公式

```
[主体描述] + [环境/背景] + [风格/艺术风格] + [构图/视角] + [光影/色彩] + [质量/细节] + [技术参数]
```

#### 2. Flux.2-Klein 快速生成模板

**角色设计提示词：**

```
角色设计：[角色名]
主体：一名[年龄]岁的[职业]，[外貌特征]，穿着[服装描述]
表情：[表情描述]
姿态：[站立/坐姿/动态]
背景：[场景环境]
风格：[艺术风格，如：日式动漫/赛博朋克/古风]
视角：[正面/侧面/特写]
光影：[自然光/戏剧性光影/电影感光效]
质量：4K分辨率，超细节，高清渲染
技术参数：--ar 16:9 --style raw
```

**场景设计提示词：**

```
场景：[场景名称]
环境：[城市/森林/室内等]，详细描述[具体元素]
氛围：[宁静/紧张/神秘/温馨]
时间：[白天/黄昏/夜晚]
天气：[晴天/雨天/阴天]
风格：[动画风格/写实/插画风格]
构图：[三分法/黄金分割/对称构图]
色彩：[冷色调/暖色调/高对比度]
细节：包含[具体装饰元素]，[光影效果]
质量：电影级质感，细节丰富
```

#### 3. MJ niji V7 动漫风格提示词

**动漫角色：**

```
[角色描述] 动漫风格，
日系插画，赛璐璐上色，
[角色动作和表情]，
服装细节：[服装细节描述]，
发色：[颜色]，眼睛：[颜色和形状]，
背景：[简化背景/抽象背景/具体场景]，
光影：柔和动漫光效，
线条流畅，色彩鲜艳，
niji style V7，
--niji 7 --ar 3:4
```

**动漫场景：**

```
[场景类型] 动漫场景，
[时间]时分，
[具体环境元素]，
[氛围描述]，
动漫背景风格，
图层感清晰，
色彩和谐，
光影富有层次，
niji V7动画风格，
--niji 7 --ar 16:9
```

#### 4. 提示词优化技巧

**负面提示词模板：**

```
负面提示词：
nsfw, low quality, ugly, deformed, blurry,
bad anatomy, extra fingers, missing limbs,
watermark, text, signature, cropped,
worst quality, low resolution, artifacts
```

**风格修饰词库：**

**艺术风格：**
- 日式动漫 / 美式动漫 / 水彩 / 油画 / 素描 / 国画
- 赛博朋克 / 蒸汽朋克 / 古风 / 现代都市
- 吉卜力风格 / 新海诚风格 / 宫崎骏风格
- 皮克斯风格 / 迪士尼风格

**光影效果：**
- 自然光 / 室内光 / 霓虹灯光 / 侧光 / 逆光
- 电影感光效 / 戏剧性光影 / 柔光 / 强光对比
- 黄金时刻 / 蓝色时刻 / 日出 / 日落

**构图技巧：**
- 三分法构图 / 黄金分割 / 对称构图 / 引导线
- 景深 / 虚化背景 / 前景模糊 / 焦点清晰
- 视角选择 / 鸟瞰 / 仰视 / 平视 / 虫视

#### 5. 使用Qwen-Image的多样化风格

**风格融合提示词：**

```
融合风格提示词：
主体：[主体描述]
风格混合：
主风格：[风格1，如：日式动漫]
次风格：[风格2，如：写实光影]
融合比例：[主风格70% + 次风格30%]
细节特点：
- 保留[风格1]的[线条风格/色彩特点]
- 融入[风格2]的[光影效果/质感]
- [其他具体要求]
输出要求：高质量细节，和谐融合
```

#### 6. 使用Kolors的色彩控制

**色彩参数提示词：**

```
色彩控制方案：
主题色调：[主色调，如：蓝色系]
配色方案：
- 主色：[具体颜色，如：深蓝色 #1a237e]
- 辅色：[具体颜色，如：青色 #00bcd4]
- 点缀色：[具体颜色，如：金色 #ffd700]
色彩情感：[如：宁静/忧郁/温暖]
对比度：[高/中/低]
饱和度：[高/中/低]
色彩应用：
- 背景使用[主色]
- 角色服装使用[辅色]
- 高光和细节使用[点缀色]
```

---

## 视频生成提示词

### 🎥 视频生成基础

#### 1. 视频提示词结构

```
[场景描述] + [人物动作] + [镜头运动] + [时长] + [风格] + [技术参数]
```

#### 2. Runway Gen 4.5 高质量生成

**电影级场景提示词：**

```
场景：[详细场景描述]
时间：[时间段]
光线：[光线描述，如：黄金时刻暖光]
人物：[人物描述，含动作]
镜头运动：
- 起始：[镜头起始状态，如：中景平视]
- 运动：[运动方式，如：缓慢推进]
- 终点：[镜头终点状态，如：近景特写]
时长：[X秒]
风格：电影质感，4K分辨率
音频：[环境音/BGM描述]
细节要求：光影自然，人物动作流畅，背景细节丰富
```

**动作捕捉提示词：**

```
动作场景：
人物：[角色名]
动作：[详细动作描述，分解为3-5个关键帧]
关键帧1（0秒）：[起始姿势和表情]
关键帧2（X秒）：[中间动作状态]
关键帧3（X秒）：[动作完成状态]
面部表情：[表情变化曲线]
身体姿态：[姿态变化细节]
服装动态：[衣物飘动/褶皱变化]
镜头：[固定/跟随/环绕]
时长：[X秒]
风格：流畅自然，物理真实
```

#### 3. VEO 3.1 竖屏+4K生成

**竖屏短视频提示词：**

```
竖屏视频（9:16）：
场景：[竖屏适合的场景，如：人物特写+背景]
构图：
- 主角：占据画面[60-70%]
- 背景：[背景环境，相对简洁]
- 前景：[可选前景元素]
人物动作：[适合竖屏的动作]
镜头运动：
- 类型：[缓慢推拉/垂直移动/轻微摇晃]
- 范围：[描述镜头移动范围]
时长：[适合短视频的时长，如：8-15秒]
分辨率：4K竖屏
风格：[短视频平台风格，如：抖音/TikTok风格]
音频：[适合竖屏的音效/BGM]
```

#### 4. Wan 2.6 专业分镜控制

**多镜头序列生成：**

```json
{
  "scene_sequence": [
    {
      "shot_id": 1,
      "description": "远景：城市天际线，夕阳",
      "camera": {
        "type": "远景",
        "angle": "平视",
        "movement": "缓慢拉远",
        "duration": "3秒"
      },
      "transition": {
        "to_shot": 2,
        "method": "淡入淡出",
        "duration": "0.5秒"
      }
    },
    {
      "shot_id": 2,
      "description": "中景：主角站在楼顶",
      "camera": {
        "type": "中景",
        "angle": "仰拍30度",
        "movement": "缓慢推进",
        "duration": "4秒"
      },
      "transition": {
        "to_shot": 3,
        "method": "切镜头",
        "duration": "0秒"
      }
    },
    {
      "shot_id": 3,
      "description": "特写：主角表情凝重",
      "camera": {
        "type": "特写",
        "angle": "平视",
        "movement": "固定",
        "focus": "眼神",
        "duration": "2秒"
      }
    }
  ]
}
```

**单镜头详细描述模板：**

```
镜头ID：[编号]
景别：[大远景/远景/全景/中景/近景/特写/大特写]
拍摄角度：[平视/仰拍/俯拍/倾斜/荷兰角]
镜头运动：
- 运动类型：[推/拉/摇/移/跟/固定]
- 运动速度：[快/中/慢]
- 运动范围：[具体描述]
焦点：
- 焦点目标：[人物/物体/环境]
- 焦点变化：[固定/变焦]
时长：[X秒]
画面内容：[详细场景描述]
人物动作：[人物动作描述]
表情：[表情描述]
环境元素：[背景、前景、装饰等]
光影：[光源位置、方向、强度、色调]
氛围：[整体氛围描述]
转场：
- 转场方式：[切镜头/淡入淡出/溶解/擦除/变形]
- 转场时长：[X秒]
- 转场目标：[下一镜头ID]
```

#### 5. 镜头语言高级技巧

**情感表达镜头：**

```
情感镜头：
目标情感：[如：孤独/希望/恐惧/愤怒]
镜头策略：
1. 景别选择：
   - 开场：[大远景建立氛围]
   - 中段：[中景/近景展开动作]
   - 高潮：[特写强化情感]
   
2. 角度运用：
   - 仰拍表现：[力量/压迫/希望]
   - 俯拍表现：[弱小/脆弱/孤独]
   - 倾斜表现：[失衡/不安/混乱]
   
3. 运动设计：
   - 缓慢推进：[情感深入/沉浸]
   - 快速拉远：[抽离/疏离]
   - 摇镜头：[观察/发现]
   
4. 光影配合：
   - 明暗对比：[冲突/矛盾]
   - 柔和光线：[温暖/希望]
   - 强烈逆光：[戏剧/神秘]
```

**节奏控制模板：**

```
节奏设计：
场景类型：[如：紧张追逐/温馨对话/独自思考]
整体节奏：[快/中/慢]

镜头序列节奏：
- 镜头1：[X秒] [动作描述]
- 镜头2：[X秒] [动作描述]
- 镜头3：[X秒] [动作描述]

节奏变化：
- 起始：[节奏描述，如：慢速铺垫]
- 发展：[节奏描述，如：逐渐加快]
- 高潮：[节奏描述，如：快速剪辑]
- 结尾：[节奏描述，如：放慢节奏]

镜头时长分布：
- 快节奏片段：[X秒/镜头] [用于紧张场景]
- 中等节奏：[X秒/镜头] [用于常规叙事]
- 慢节奏：[X秒/镜头] [用于情感沉淀]
```

#### 6. 镜头转场技巧

**常用转场方式：**

1. **切镜头 (Cut)**：直接切换，适合节奏快的场景
   ```
   转场类型：切镜头
   适用场景：对话切换、动作衔接
   时长：0秒
   特点：干净利落，无过渡效果
   ```

2. **淡入淡出 (Fade In/Out)**：渐变转场，适合时间跳跃
   ```
   转场类型：淡入淡出
   适用场景：时间段转换、场景切换
   时长：1-2秒
   效果：黑色渐变过渡
   ```

3. **溶解 (Dissolve)**：两个场景重叠渐变
   ```
   转场类型：溶解
   适用场景：回忆与现实、平行剪辑
   时长：1-1.5秒
   效果：画面叠加渐变
   ```

4. **擦除 (Wipe)**：线条或形状擦过屏幕
   ```
   转场类型：擦除
   适用场景：时空穿越、风格化过渡
   时长：0.5-1秒
   方向：[水平/垂直/对角]
   ```

5. **变形转场 (Morph)**：画面元素变形为下一场景
   ```
   转场类型：变形转场
   适用场景：梦幻、创意转场
   时长：1-2秒
   变形元素：[具体变形物体或形状]
   ```

---

## 智能体调用指南

### 🤖 智能体工作流程

#### 1. 完整创作流程

```
阶段1：剧本创作
├─ 使用Claude Sonnet 4.5/ChatGPT-5
├─ 生成完整剧本和角色设定
├─ 输出：剧本文本 + 角色档案

阶段2：分镜头设计
├─ 使用ChatGPT-5分析剧本
├─ 生成分镜头脚本
├─ 输出：分镜头表格

阶段3：图像生成
├─ Flux.2-Klein快速生成概念图
├─ MJ niji V7生成动漫角色
├─ Qwen-Image生成多样化场景
├─ 输出：角色图/场景图/关键帧

阶段4：视频生成
├─ Wan 2.6生成分镜头视频
├─ Runway Gen 4.5生成高质量场景
├─ VEO 3.1生成竖屏片段
├─ 输出：视频片段

阶段5：音频制作
├─ Qwen3-TTS生成角色配音
├─ HeartMuLa生成BGM
├─ 输出：音频文件

阶段6：后期合成
├─ 视频剪辑 + 音频同步
├─ 添加字幕和特效
├─ 输出：完整漫剧
```

#### 2. 模型调用决策树

```
文本创作阶段：
├─ 剧本架构/剧情逻辑 → ChatGPT-5
├─ 台词创作 → Claude Sonnet 4.5
├─ 创意构思 → Gemini 2.5 pro
└─ 教育类内容 → Claude Sonnet 4.5

图像生成阶段：
├─ 快速迭代/批量生成 → Flux.2-Klein
├─ 动漫角色/场景 → MJ niji V7
├─ 多样化风格 → Qwen-Image
├─ 色彩精确控制 → Kolors
└─ 角色设计 → Z-Image-Turbo

视频生成阶段：
├─ 电影级场景 → Runway Gen 4.5
├─ 竖屏短视频 → VEO 3.1
├─ 专业分镜 → Wan 2.6
└─ 镜头角度转换 → Qwen Image Edit

音频制作阶段：
├─ 角色配音 → Qwen3-TTS
├─ 对话型内容 → IndexTTS2+infinite talk
└─ BGM生成 → HeartMuLa
```

### 🔧 API调用模板

#### 1. 图像生成API调用

**Flux.2-Klein快速生成：**

```python
def generate_image_flux(prompt, style_params):
    """
    Flux.2-Klein 图像生成
    特点：秒级出图，适合快速迭代
    """
    api_call = {
        "model": "Flux.2-Klein",
        "prompt": prompt,
        "negative_prompt": "nsfw, low quality, ugly, deformed",
        "parameters": {
            "width": 1024,
            "height": 1024,
            "steps": 20,
            "guidance_scale": 7.5,
            "seed": style_params.get("seed", -1),
            "style": style_params.get("style", "default")
        },
        "optimization": {
            "fast_mode": True,  # 启用快速模式
            "batch_size": style_params.get("batch_size", 1)
        }
    }
    return api_call

# 使用示例
prompt = """
角色设计：一名25岁的赛博朋克黑客，
银色短发，戴着AR眼镜，穿着黑色皮夹克，
表情专注，手指在键盘上快速敲击，
背景是充满霓虹灯的赛博城市，
赛博朋克风格，电影感光效，
4K分辨率，超细节
"""

result = generate_image_flux(prompt, {"style": "cyberpunk"})
```

**MJ niji V7动漫生成：**

```python
def generate_anime_niji(prompt, composition):
    """
    MJ niji V7 动漫风格生成
    特点：专门优化的动漫风格
    """
    api_call = {
        "model": "midjourney-niji-v7",
        "prompt": prompt,
        "parameters": {
            "version": "v7",
            "aspect_ratio": composition.get("ar", "3:4"),
            "style": "anime",
            "quality": "high",
            "stylize": composition.get("stylize", 250)
        },
        "niji_specific": {
            "niji_mode": True,
            "anime_style": composition.get("anime_style", "japanese")
        }
    }
    return api_call

# 使用示例
prompt = """
动漫角色设计：女巫，
紫色长发，戴着尖顶帽，
穿着深紫色长袍，手持魔法杖，
表情神秘，姿态优雅，
背景是神秘的魔法森林，
日系动漫风格，赛璐璐上色，
柔和光效，线条流畅，
--niji 7 --ar 3:4 --style raw
"""

composition = {
    "ar": "3:4",
    "anime_style": "japanese",
    "stylize": 300
}

result = generate_anime_niji(prompt, composition)
```

#### 2. 视频生成API调用

**Runway Gen 4.5高质量生成：**

```python
def generate_video_runway(scene_description, camera_params):
    """
    Runway Gen 4.5 视频生成
    特点：高质量，电影级输出
    """
    api_call = {
        "model": "runway-gen4.5",
        "prompt": scene_description,
        "parameters": {
            "duration": camera_params.get("duration", 5),
            "resolution": "4K",
            "fps": 30,
            "camera_control": {
                "starting_shot": camera_params.get("start_shot"),
                "camera_movement": camera_params.get("movement"),
                "ending_shot": camera_params.get("end_shot"),
                "movement_speed": camera_params.get("speed", "medium")
            },
            "quality": {
                "high_quality": True,
                "detail_enhancement": True
            }
        },
        "style": {
            "cinematic": True,
            "lighting": "natural",
            "color_grading": "filmic"
        }
    }
    return api_call

# 使用示例
scene_description = """
电影级场景：黄昏时分，
一名年轻女性站在海边悬崖上，
海风吹动她的长发，
她凝视着远方的海平线，
夕阳的光芒洒在海面上，
形成金色的光带，
氛围：孤独而坚强
"""

camera_params = {
    "duration": 8,
    "start_shot": {
        "type": "中景",
        "angle": "平视"
    },
    "movement": "缓慢推进",
    "end_shot": {
        "type": "近景",
        "angle": "仰拍30度"
    },
    "speed": "slow"
}

result = generate_video_runway(scene_description, camera_params)
```

**Wan 2.6分镜控制：**

```python
def generate_video_wan(shot_sequence):
    """
    Wan 2.6 专业分镜控制
    特点：精确分镜控制
    """
    api_call = {
        "model": "wan-2.6",
        "shot_sequence": shot_sequence,
        "global_settings": {
            "resolution": "4K",
            "fps": 24,
            "style": "cinematic"
        },
        "transition_control": {
            "enable_transitions": True,
            "smooth_transitions": True
        }
    }
    return api_call

# 使用示例
shot_sequence = [
    {
        "shot_id": 1,
        "description": "远景：城市天际线，夕阳",
        "camera": {
            "type": "wide_shot",
            "angle": "eye_level",
            "movement": "slow_pull_out",
            "duration": 3
        },
        "transition": {
            "method": "fade",
            "duration": 0.5
        }
    },
    {
        "shot_id": 2,
        "description": "中景：主角站在楼顶",
        "camera": {
            "type": "medium_shot",
            "angle": "low_angle",
            "angle_degrees": 30,
            "movement": "slow_dolly_in",
            "duration": 4
        },
        "transition": {
            "method": "cut",
            "duration": 0
        }
    },
    {
        "shot_id": 3,
        "description": "特写：主角眼神",
        "camera": {
            "type": "close_up",
            "angle": "eye_level",
            "movement": "static",
            "focus": "eyes",
            "duration": 2
        }
    }
]

result = generate_video_wan(shot_sequence)
```

#### 3. TTS语音生成API

**Qwen3-TTS声音克隆：**

```python
def generate_tts_qwen(text, voice_params):
    """
    Qwen3-TTS 语音生成
    特点：声音克隆 + 情感控制
    """
    api_call = {
        "model": "qwen3-tts",
        "text": text,
        "voice_settings": {
            "voice_cloning": voice_params.get("use_clone", False),
            "reference_audio": voice_params.get("reference_file", None),
            "character_name": voice_params.get("character", "default"),
            "emotion": voice_params.get("emotion", "neutral"),
            "speaking_style": voice_params.get("style", "conversational"),
            "pitch": voice_params.get("pitch", 1.0),
            "speed": voice_params.get("speed", 1.0),
            "volume": voice_params.get("volume", 1.0)
        },
        "output": {
            "format": "wav",
            "sample_rate": 48000,
            "bit_depth": 16
        },
        "emotion_control": {
            "enable_emotion": True,
            "emotion_intensity": voice_params.get("emotion_intensity", 0.7),
            "emotion_curve": voice_params.get("emotion_curve", "flat")
        }
    }
    return api_call

# 使用示例
text = "对不起，我不能让你这么做。这是为了我们所有人的安全。"

voice_params = {
    "use_clone": True,
    "reference_file": "character_voice_reference.wav",
    "character": "主角_艾米",
    "emotion": "tense",
    "style": "dramatic",
    "pitch": 1.1,
    "speed": 0.9,
    "volume": 1.0,
    "emotion_intensity": 0.8,
    "emotion_curve": "rising"
}

result = generate_tts_qwen(text, voice_params)
```

#### 4. LLM剧本创作API

**ChatGPT-5剧本创作：**

```python
def generate_script_gpt5(prompt, script_params):
    """
    ChatGPT-5 剧本创作
    特点：逻辑严密，适合复杂剧情
    """
    api_call = {
        "model": "gpt-5",
        "messages": [
            {
                "role": "system",
                "content": """你是一位专业的AI漫剧编剧，擅长创作引人入胜的故事。
你需要生成完整的剧本，包含：
1. 角色设定（性格、背景、动机）
2. 场景描述（时间、地点、氛围）
3. 对话（符合角色性格）
4. 动作指导
5. 分镜头建议"""
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "parameters": {
            "temperature": script_params.get("temperature", 0.8),
            "max_tokens": script_params.get("max_tokens", 4000),
            "top_p": script_params.get("top_p", 0.9)
        },
        "output_format": {
            "type": "markdown",
            "include_sections": [
                "角色设定",
                "剧本正文",
                "分镜头脚本"
            ]
        }
    }
    return api_call

# 使用示例
prompt = """
请为我创作一个短篇AI漫剧剧本，主题是"勇气"。
要求：
1. 时长：3-5分钟
2. 角色：1-2个主要角色
3. 风格：温馨感人
4. 场景：校园或城市
5. 包含完整的角色设定和分镜头建议

请按照以下结构输出：
- 第一幕：开场（介绍角色和设定）
- 第二幕：发展（冲突和挑战）
- 第三幕：高潮（关键转折点）
- 第四幕：结局（成长和升华）
"""

script_params = {
    "temperature": 0.85,
    "max_tokens": 5000,
    "top_p": 0.95
}

result = generate_script_gpt5(prompt, script_params)
```

### 📊 智能体决策矩阵

| 创作阶段 | 任务类型 | 推荐模型 | 备选模型 | 决策依据 |
|---------|---------|---------|---------|---------|
| **剧本创作** | 剧本架构 | ChatGPT-5 | Claude Sonnet 4.5 | 逻辑严密性 |
| | 台词创作 | Claude Sonnet 4.5 | Gemini 2.5 pro | 创意表达 |
| | 角色设定 | Gemini 2.5 pro | ChatGPT-5 | 角色深度 |
| **图像生成** | 快速概念 | Flux.2-Klein | Z-Image-Turbo | 速度优先 |
| | 动漫角色 | MJ niji V7 | Qwen-Image | 风格契合 |
| | 多样化场景 | Qwen-Image | Kolors | 风格兼容 |
| | 精细调色 | Kolors | Qwen-Image | 色彩控制 |
| **视频生成** | 电影级 | Runway Gen 4.5 | Wan 2.6 | 质量 |
| | 专业分镜 | Wan 2.6 | Runway Gen 4.5 | 控制力 |
| | 竖屏内容 | VEO 3.1 | Runway Gen 4.5 | 格式适配 |
| | 镜头转换 | Qwen Image Edit | Wan 2.6 | 3D控制 |
| **音频制作** | 角色配音 | Qwen3-TTS | IndexTTS2 | 情感控制 |
| | 连续对话 | IndexTTS2+infinite talk | Qwen3-TTS | 自然流畅 |
| | 背景音乐 | HeartMuLa | - | 开源可控 |

### 🎯 性能优化建议

#### 1. 批量处理优化

```python
# 并行处理多张图像
def batch_generate_images(image_prompts, model="Flux.2-Klein"):
    """
    批量生成图像
    适合快速迭代和概念设计
    """
    batch_size = len(image_prompts)
    api_call = {
        "model": model,
        "prompts": image_prompts,
        "batch_processing": True,
        "parallel_requests": min(batch_size, 10),  # 限制并发数
        "quality_mode": "fast"  # 批量模式使用快速质量
    }
    return api_call
```

#### 2. 成本控制策略

```
优先级分级策略：

A级（高质量）：
- Runway Gen 4.5（关键场景）
- Qwen3-TTS（主角配音）
- MJ niji V7（主要角色设计）

B级（标准）：
- Wan 2.6（分镜头）
- Qwen-Image（场景生成）
- Flux.2-Klein（批量概念）

C级（快速）：
- Flux.2-Klein快速模式
- Z-Image-Turbo（预览）
- IndexTTS2（群演配音）
```

#### 3. 质量控制检查点

```
检查点1：剧本阶段
□ 角色设定完整
□ 对话符合性格
□ 剧情逻辑连贯
□ 分镜头合理

检查点2：图像阶段
□ 角色一致性
□ 风格统一
□ 色彩和谐
□ 细节质量

检查点3：视频阶段
□ 运动流畅
□ 光影自然
□ 镜头语言准确
□ 转场合适

检查点4：音频阶段
□ 声音清晰
□ 情感到位
□ 音量均衡
□ 同步准确
```

### 🔄 迭代优化流程

```
版本迭代流程：

v1.0 → 草稿阶段
├─ 使用Flux.2-Klein快速生成概念图
├─ 使用ChatGPT-5生成基础剧本
└─ 使用IndexTTS2快速配音预览

v1.5 → 优化阶段
├─ 使用MJ niji V7优化角色设计
├─ 使用Claude Sonnet 4.5优化对话
├─ 使用Wan 2.6生成分镜头
└─ 使用Qwen3-TTS优化配音

v2.0 → 精修阶段
├─ 使用Runway Gen 4.5生成高质量视频
├─ 使用Qwen3-TTS精细情感控制
├─ 使用Kolors调色优化
└─ 使用HeartMuLa专业BGM

v2.5 → 最终阶段
├─ 整体质量检查
├─ 细节优化
├─ 音画同步调整
└─ 最终输出
```

---

## 📝 附录

### 常用术语表

| 术语 | 英文 | 解释 |
|------|------|------|
| 景别 | Shot Size | 镜头包含的画面范围（远景、全景、中景等） |
| 拍摄角度 | Camera Angle | 相机相对于被摄对象的位置（平视、仰拍、俯拍） |
| 镜头运动 | Camera Movement | 相机的移动方式（推、拉、摇、移、跟） |
| 转场 | Transition | 镜头之间的切换方式 |
| 分镜 | Storyboard | 用图像表示每个镜头的画面 |
| 提示词 | Prompt | 指导AI生成内容的文本描述 |
| 声音克隆 | Voice Cloning | 复制特定人声的技术 |
| 情感控制 | Emotion Control | 调节AI输出情感强度的功能 |

### 模型参数速查表

```
Flux.2-Klein:
- 分辨率：512-1024
- 采样步数：15-25
- 引导系数：6.5-8.0
- 速度：~1秒/张

MJ niji V7:
- 分辨率：自适应
- --niji 7
- --ar 3:4 或 16:9
- --style raw

Runway Gen 4.5:
- 分辨率：4K
- 帧率：30fps
- 时长：4-18秒
- 质量：电影级

Wan 2.6:
- 分辨率：4K
- 帧率：24/30fps
- 分镜控制：精确
- 转场：多样化

Qwen3-TTS:
- 采样率：48kHz
- 格式：WAV/MP3
- 情感：10+种
- 速度：0.5-2.0x
```

### 快速参考卡

#### 剧本创作快速检查
- [ ] 角色动机明确
- [ ] 冲突设置合理
- [ ] 对话自然流畅
- [ ] 节奏张弛有度

#### 图像生成快速检查
- [ ] 主体清晰
- [ ] 风格统一
- [ ] 比例正确
- [ ] 质量满意

#### 视频生成快速检查
- [ ] 运动流畅
- [ ] 时长合适
- [ ] 光影自然
- [ ] 镜头准确

#### 音频生成快速检查
- [ ] 清晰度好
- [ ] 情感到位
- [ ] 音量适中
- [ ] 无杂音

---

## 📞 技术支持

如需进一步的技术支持或有任何问题，请参考：
- 模型官方文档
- 语雀"漫屋大模型评测"文档库
- AI漫剧创作者社区

---

**文档版本**: v1.0
**最后更新**: 2026年1月25日
**维护者**: AI漫剧创作技术团队

---
name: industrial-video-gen
description: |
  工业化 AI 视频生成 Skill。规则驱动，非代码。
  核心：结构化描述、参考图管理、项目级风格锁定、禁止一句话 prompt。
  工作流：角色生成(character/) → 场景生成(scene/) → 关键帧生成(keyframe/) → 故事板生成(storyboard/) → 视频生成(video/)。
  每个工作流目录包含 README(描述+流程)、rules(规则)、prompt-template(模板)。
  同时支持 Seedance 2.0 视频提示词工程。
---

# Industrial Video Generation

工业化视频生成的规则体系。所有操作由 Agent 按规则执行，调用底层 content-gen skill 完成实际 API 调用。

## 文件结构

| 文件/目录 | 内容 |
|-----------|------|
| [SKILL.md](SKILL.md) | 本文件：总览与任务路由 |
| [core-rules.md](core-rules.md) | 核心规则：命名规范、提示词分层结构、项目风格锁定 |
| [character/](character/) | 角色生成工作流：描述、规则、模板 |
| [scene/](scene/) | 场景生成工作流：描述、规则、模板 |
| [keyframe/](keyframe/) | 关键帧生成工作流：描述、规则、模板 |
| [storyboard/](storyboard/) | 故事板生成工作流：描述、规则、模板 |
| [video/](video/) | 视频生成工作流：描述、规则、模板 |
| [reference-images.md](reference-images.md) | 参考图规则：参考图描述规范、使用方式 |
| [generation.md](generation.md) | 生成执行：调用 content-gen 的命令规范 |
| [seedance.md](seedance.md) | Seedance 2.0 视频提示词工程 |
| [experience.md](experience.md) | 实践经验：景别匹配、时间粒度等最佳实践 |

## 快速导航

### 按任务类型

| 我要做... | 看这里 |
|-----------|--------|
| 生成角色参考图（三视图+表情） | [character/README.md](character/README.md) |
| 生成场景参考图（多视角/时间/天气） | [scene/README.md](scene/README.md) |
| 生成单帧关键帧 | [keyframe/README.md](keyframe/README.md) |
| 生成九宫格关键帧 | [keyframe/README.md](keyframe/README.md) |
| 生成故事板 | [storyboard/README.md](storyboard/README.md) |
| 生成视频 | [video/README.md](video/README.md) |

### 按问题类型

| 问题 | 看这里 |
|------|--------|
| 文件怎么命名？ | [core-rules.md → 命名规范](core-rules.md#命名规范) |
| 提示词怎么分层写？ | 各工作流目录下的 prompt-template.md |
| 参考图怎么描述？ | [reference-images.md](reference-images.md) |
| 生成命令怎么写？ | [generation.md](generation.md) |
| Seedance 提示词怎么写？ | [seedance.md](seedance.md) |

## 与 content-gen skill 的关系

本 skill 是**规则层**，content-gen skill 是**执行层**。

工作流程：

1. 用户请求生成
2. Agent 判断任务类型 → 按本 skill 规则构建结构化 prompt
3. Agent 调用 content-gen skill 执行实际 API 调用
4. Agent 按本 skill 规则处理输出（文件存放、prompt 持久化）

**不重复造轮子**：所有 API 调用、状态查询、下载逻辑，全部复用 content-gen skill 的脚本。

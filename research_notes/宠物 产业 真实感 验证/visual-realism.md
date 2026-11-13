# Web 上传真实猫狗照片后的持续动作与视觉真实感验证

访问日期：2026-11-12（America/Toronto）。本研究只使用公开来源；代码、Google Drive 数据和项目文件均未修改。视觉是首要验收：先看身份稳定、动作自然、循环无缝、边缘/五官不变形，再看模型速度和工程成本。

## 问题一：身份一致的 image-to-video 短片能否成为猫狗 MVP 的真实感主路径？

### Takeaway
开源路线中，LivePortrait 是最直接的“宠物照片 + 驱动动作”证据：官方 Animals model 针对约 230K 帧动物数据（主要猫狗），并在 2025-01 发布 v1.1 改善狗嘴识别；但动物 stitching/retargeting 未训练、官方建议关闭 stitching 且不推荐 paste-back，Animals 仅在 Linux/Windows + NVIDIA GPU 测试。因此它适合离线生成 2–5 秒动作片段，不能直接承诺浏览器实时或商业可发布。

### Cited Findings
- LivePortrait 官方仓库在 2024-08-02 发布 Animals mode，说明其训练约 230K 帧动物数据，主要是猫和狗；同一说明明确动物模型没有训练 stitching 和 retargeting 模块，建议运行时 --no_flag_stitching，且不推荐 paste-back。[Animals mode changelog](https://github.com/KwaiVGI/LivePortrait/blob/main/assets/docs/changelog/2024-08-02.md)（访问：2026-11-12）
- LivePortrait 2025-01 更新写明 Animals v1.1 使用更多数据；猫仅“slight improvement”，狗嘴识别相对旧版本有所改进，说明宠物五官仍是需要逐个物种/动作验收的误差源。[Animals v1.1 changelog](https://github.com/KwaiVGI/LivePortrait/blob/main/assets/docs/changelog/2025-01-01.md)（访问：2026-11-12）
- LivePortrait README 的动物快速上手命令使用一张 source image、wink.pkl 驱动模板和 --driving_multiplier，生成 mp4；官方建议自定义 driving video 为 1:1、聚焦头部、减少肩部运动，并要求第一帧正面中性表情。[LivePortrait README](https://github.com/KwaiVGI/LivePortrait)（访问：2026-11-12）
- LivePortrait README 说明 Animals mode 只在 Linux/Windows + NVIDIA GPU 测试；X-Pose 是动物关键点检测器，依赖自定义 CUDA/C++ op；README 还报告首次 torch.compile 约一分钟，后续推理快 20–30%，但效果随 CUDA 版本变化。[LivePortrait README](https://github.com/KwaiVGI/LivePortrait)（访问：2026-11-12）
- LivePortrait 代码 LICENSE 是 MIT，但许可证说明其依赖的 InsightFace models 仅限 non-commercial research；若要商业使用，需替换 InsightFace detection models。Animals changelog 同时警告 X-Pose 仅 Non-commercial Scientific Research Purposes，商业应用要替换检测器。[LivePortrait LICENSE](https://github.com/KwaiVGI/LivePortrait/blob/main/LICENSE)；[Animals changelog](https://github.com/KwaiVGI/LivePortrait/blob/main/assets/docs/changelog/2024-08-02.md)（访问：2026-11-12）
- Wan2.1 README 提供 Image-to-Video 与 First-Last-Frame-to-Video（FLF2V）；FLF2V 命令明确需要 first_frame 和 last_frame，当前 720P 路径，示例包含小鸟动作，不能据此推断猫狗身份稳定。[Wan2.1 README](https://github.com/Wan-Video/Wan2.1)（访问：2026-11-12）
- Wan2.1 仓库许可段将模型列为 Apache 2.0，并给出 1.3B 模型在 RTX 4090 上生成 5 秒 480P 视频约 4 分钟、约 8.19 GB VRAM 的官方数据；该数字是作者环境和生成任务的 benchmark，不是浏览器端延迟或实时播放承诺。[Wan2.1 README](https://github.com/Wan-Video/Wan2.1)（访问：2026-11-12）
- Wan2.2 TI2V-5B 官方 README 给出 24 FPS、720P，单消费级 GPU 5 秒 720P 未优化时 under 9 minutes；单 GPU 运行说明至少 24 GB VRAM（例如 RTX 4090），模型许可证为 Apache 2.0。这个规模适合服务器离线队列，不适合网页端即时生成。[Wan2.2 README](https://github.com/Wan-Video/Wan2.2)；[Wan2.2 model card](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B)（访问：2026-11-12）
- Phantom 是 Apache 2.0 的 subject-consistent video framework，支持单/多参考图；官方仓库的示例 prompt 包含一只棕白狗，并通过 --ref_image 传多张参考图。该证据证明可做多图条件的视频实验，但 README 没有猫狗 identity benchmark 或 loop seam 保证。[Phantom README](https://github.com/Phantom-video/Phantom)；[Phantom model card](https://huggingface.co/bytedance-research/Phantom)（访问：2026-11-12）

### Inferences
- 最小可用 I2V 实验应先用 LivePortrait Animals v1.1 做低动作幅度的 wink/ear/tail idle 片段，保存为透明背景或已抠出的 RGBA 片段，再由前端状态机拼接；Wan/Phantom 用作离线对照，因为公开数据给出多分钟 GPU 生成边界而非交互延迟。
- 为降低首尾跳变，生成每个动作时应固定第一帧为中性源图，并让最后一帧回到同一姿态或生成首帧/末帧约束片段；Wan FLF2V 可验证“指定首末帧”能力，但无法假定其自动产生无缝循环。
- 对真实身份要记录源图与每个片段的脸部/耳缘/毛色一致性分数和人工通过率；不能用“模型支持猫/狗 prompt”替代个体一致性证据。

### Gaps
- 没有找到官方 LivePortrait Animals 的逐猫/逐狗 identity score、首尾 seam score、透明视频输出保证或浏览器 WebAssembly/WebGPU 版本。
- Wan2.1/2.2 和 Phantom 的官方 benchmark 不是宠物身份 benchmark；猫狗变形、嘴鼻混淆、尾巴重复和背景漂移仍需项目样本实测。
- API 云服务价格、GPU 租用价格和实时排队成本未在本次公开源码证据中形成稳定数字，不应凭空估价；实验应记录实际 wall-clock、GPU 型号、VRAM、输出帧数和队列时间。

## 问题二：2.5D 分层变形是否比生成式短片更适合网页端持续自然动作？

### Takeaway
2.5D 是当前网页 MVP 的可控默认路径：本地抠图后分成身体、耳、眼、尾、影子等层，以网格/mesh warp、透明纹理和动作曲线做呼吸、眨眼、耳尾摆动与轻微视差。它牺牲生成式视频的细节，但身份不会逐帧重绘，循环、延迟和隐私都更容易测量。

### Cited Findings
- PixiJS 8 官方 Mesh 文档说明 Mesh 支持 WebGL/WebGPU 状态、可直接更新 geometry；MeshPlane 是可细分 quad，适合 distortion/grid-based warping；MeshRope 可沿控制点弯曲纹理并可每帧更新。[PixiJS Mesh guide](https://pixijs.com/8.x/guides/components/scene-objects/mesh)（访问：2026-11-12）
- Three.js 官方 AnimationMixer 文档说明动画可用 AnimationClip/AnimationAction 播放、混合、暂停和按 delta time 更新，适合把 idle、blink、ear-up、tail-sway 作为可组合动作状态。[Three.js AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html)（访问：2026-11-12）
- Three.js 项目 README 将库定位为跨浏览器 3D library，当前 builds 含 WebGL/WebGPU renderers；GitHub API 标注 MIT。[Three.js README](https://github.com/mrdoob/three.js)；[Three.js LICENSE](https://github.com/mrdoob/three.js/blob/dev/LICENSE)（访问：2026-11-12）
- React Three Fiber 和 Drei 的 GitHub 项目均标注 MIT；Drei 提供 React Three Fiber helper，可把 sprite、mesh、相机和交互状态保持在 React 组件中。[react-three-fiber](https://github.com/pmndrs/react-three-fiber)；[Drei](https://github.com/pmndrs/drei)（访问：2026-11-12）
- FFmpeg 官方 filters 文档提供 xfade 跨两个输入做 fade transition、loop 循环帧以及 chromakey 绿幕透明合成示例。它可用于离线验证片段拼接/透明背景流程，但绿幕不是自动抠图，且 fade 可能掩盖真实 seam，应同时保存硬切和交叉淡化版本。[FFmpeg filters documentation](https://ffmpeg.org/ffmpeg-filters.html)（访问：2026-11-12）
- MDN 的 HTMLVideoElement.requestVideoFrameCallback() 在新设备/浏览器中按视频帧回调，可用于每帧绘制、视频分析和同步；getVideoPlaybackQuality() 提供 total/lost frames 等播放质量指标。[requestVideoFrameCallback](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback)；[getVideoPlaybackQuality](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/getVideoPlaybackQuality)（访问：2026-11-12）

### Inferences
- 对猫狗照片，2.5D 应把身份纹理锁在源图层，仅变形局部网格；耳尖、眼睑、鼻头和尾巴根部用少量顶点控制，动作幅度设上限，避免生成式重绘导致的斑纹漂移、眼睛变形和多尾。
- 前端可以用 requestVideoFrameCallback 或 requestAnimationFrame 驱动状态机，并记录 callback interval、render FPS、long task、lost frames；视频循环则比较首尾关键点位置、边缘 alpha 和 perceptual difference，不能只凭播放流畅判断无缝。
- 透明背景优先使用本地 alpha mask；如果要验证绿幕/透明视频编码，用 FFmpeg chromakey/overlay 离线生成测试素材，再将结果转成 WebM/PNG sequence。绿幕处理不能代替毛发级抠图验收。

### Gaps
- Pixi/Three 文档证明了可编程变形和动画 API，但没有证明单张猫狗照片能自动得到正确的耳/眼/尾骨架；分层点位仍需人工标注或专门宠物关键点模型。
- 浏览器实际 FPS、移动设备功耗、WebM alpha 编解码兼容性和透明视频体积需在目标 Chrome/Safari/Firefox 设备矩阵实测；本次没有将桌面 benchmark 推广成浏览器结论。

## 问题三：3D rig、透明输出、循环验收和最小实验如何落地？

### Takeaway
3D rig 适合后续高风险研究，不应成为单照片猫狗 MVP 默认路线。UniRig 能从已有 3D mesh 预测 animal skeleton/skinning，但输入是 OBJ/FBX/GLB/VRM 等 3D 模型且需要 CUDA；它没有证明“单张 2D 宠物照片→可用 rig”。GaussianSplats3D 可在浏览器显示 splat 场景，但需要多视角/已生成 splat 资产，默认 shared memory 还涉及跨源隔离。

### Cited Findings
- UniRig 官方项目将其定位为自动 3D model rigging，并称统一框架目标覆盖 humans、animals、objects；输入示例是 .obj/.fbx/.glb/.vrm，命令输出 skeleton/skin FBX。README 警告若 skeleton 不准（例如缺尾骨），skinning 结果可能显著退化；生成要求 CUDA GPU 至少 8 GB VRAM。[UniRig README](https://github.com/VAST-AI-Research/UniRig)（访问：2026-11-12）
- UniRig 代码 LICENSE 为 MIT，但模型卡也只描述对已有 3D models 的 skeleton/skinning prediction；因此 MIT 代码许可证不能转化为“从宠物照片自动生成可商用 rig”的能力承诺。[UniRig LICENSE](https://github.com/VAST-AI-Research/UniRig/blob/main/LICENSE)；[UniRig model card](https://huggingface.co/VAST-AI/UniRig)（访问：2026-11-12）
- GaussianSplats3D 是 MIT 的 Three.js-based 3D Gaussian Splatting viewer，可加载 .ply/.splat/.ksplat，与 Three.js scene/camera/renderer 集成；它是浏览器渲染器，不是从单张猫狗照片自动生成资产的模型。[GaussianSplats3D README](https://github.com/mkkellogg/GaussianSplats3D)；[LICENSE](https://github.com/mkkellogg/GaussianSplats3D/blob/main/LICENSE)（访问：2026-11-12）
- GaussianSplats3D README 说明默认 sorting 使用 SharedArrayBuffer；若启用 shared memory，服务端需 Cross-Origin-Opener-Policy: same-origin 和 Cross-Origin-Embedder-Policy: require-corp，否则会遇到跨源隔离错误；可以关闭 shared memory，但性能/能力取舍需要实测。[GaussianSplats3D CORS/SharedArrayBuffer](https://github.com/mkkellogg/GaussianSplats3D#cors-issues-and-sharedarraybuffer)（访问：2026-11-12）
- AnimatedDrawings 是 MIT 许可的分割、rig、动画和透明 GIF 示例，但其 README 明确算法描述的是 human figure，并且预训练 detector/pose 是 human-like figure；它不能作为猫狗姿态已验证方案。其透明 GIF 导出可作为输出格式参考。[AnimatedDrawings README](https://github.com/facebookresearch/AnimatedDrawings)；[LICENSE/model note](https://github.com/facebookresearch/AnimatedDrawings#license)（访问：2026-11-12）
- SAM 2 官方仓库是 Apache 2.0，支持图像/视频 promptable segmentation 和 streaming memory；README 的安装要求 Python >=3.10、PyTorch >=2.5.1、TorchVision >=0.20.1，公开速度表是 A100，不是浏览器或透明视频 benchmark。[SAM 2 README](https://github.com/facebookresearch/sam2)（访问：2026-11-12）

### Inferences
- 3D 研究入口应是用户上传 3–5 张照片后先做多视角一致性检查，再尝试生成或手工修正 GLB；单张照片只进入 2.5D。即使 3D rig 成功，也要单独验收毛发/纹理、耳尾骨骼、动作循环和浏览器加载成本。
- “透明背景/绿幕”应拆成两项验收：A) mask/alpha 是否保留毛发边缘；B) 编码和合成是否在目标浏览器可靠显示。绿幕 chroma key、PNG sequence、WebM alpha 是不同路径，不能互相替代。
- 循环 seam 的自动检查可定义为：首尾 5 帧的主体 bbox IoU、鼻尖/眼角/耳尖/尾根关键点位移、alpha 边缘差、感知图像距离；再用人工 5 分制评“身份、自然、变形、循环”。阈值应从样本测量后设定，不先编造通过率。

### 最小可用实验（不预设成本或性能结论）
- 样本：一只橘猫和一只金毛；每只准备 3–5 张照片，至少包含正面中性、3/4 视角、侧脸/全身，保留原图与拍摄条件记录。每只先生成同一套动作：idle-breathe、blink、ear/tail micro-move、look-left/right、sleep/wake、attention（4–6 个动作）。
- 路线 A（身份一致 I2V）：LivePortrait Animals v1.1 生成每动作 2–5 秒短片；同时以 Wan2.1 FLF2V 或 Phantom 做少量对照。记录 source/driver、分辨率、帧率、生成 wall-clock、峰值 VRAM、模型版本、失败重试次数；透明输出若模型不支持则先做 mask/paste-back实验，并单独标记其风险。
- 路线 B（2.5D）：对每只宠物建立身体、眼、耳、尾、影子层或网格控制点；用 Three.js/R3F/Pixi MeshPlane/MeshRope 播放同一套 4–6 动作。记录模型加载时间、首次可见时间、每帧 JS/渲染耗时、FPS、掉帧/long task、内存、移动端电量（若可测）。
- 路线 C（3D rig 研究）：仅对已有或重建的 GLB 做 UniRig/手工 rig；将其与 2.5D 同动作对照，记录 skeleton 修正次数、GLB/纹理大小、加载时间、动画 FPS、耳尾错位。不要把单张照片直接生成 3D rig 当作验收前提。
- 视觉评分：每个片段由至少 3 名评审盲评 1–5 分：身份一致（脸纹/毛色/耳形）、自然动作（生物合理性）、局部失真（眼/鼻/嘴/耳/尾）、循环无缝（首尾跳变/闪烁）、背景/透明边缘。报告均值、中位数、每项失败样本，不只报总分。
- 身份与循环自动证据：对 source 与每段抽取同尺寸 face/head crop，使用固定视觉 embedding 仅作相似度辅助；首尾比较 bbox IoU、关键点位移、alpha 边缘差和 perceptual distance。阈值在完成首轮样本后以分位数/人工标签校准，当前不宣称任何模型达到阈值。
- 浏览器性能验收：在 Chrome/Safari/Firefox 至少各一台桌面和一台移动设备上，固定 720p/480p 两档；用 requestVideoFrameCallback 的 presentedFrames/processingDuration 与 getVideoPlaybackQuality() 的 total/lost frames 记录播放质量。对 2.5D 记录 30 秒 idle、动作切换和循环时的 FPS、长任务、内存；对 I2V 只测下载/解码/播放，不把服务器生成时间伪装成浏览器延迟。
- 视觉优先门槛：若 I2V 在身份、局部失真或循环任一项明显低于 2.5D，默认发布路线保留 2.5D；I2V 仅作为高质量短片/非关键动作增强。若 3D rig 无法在耳尾和毛发视觉评分上稳定超过 2.5D，则继续作为研究开关，不进入默认体验。

### Gaps
- 公开项目没有统一的猫狗 identity consistency、loop seam、透明 alpha 质量和浏览器 FPS benchmark；这些必须由上面的橘猫/金毛实验建立。
- 本次没有足够证据判断任何开源 I2V 模型在商业环境的完整模型/依赖链合规性；LivePortrait 的 X-Pose/InsightFace 限制尤其需要替换后再审。
- 不应从仓库中的猫狗示例、GPU 时间或模型许可证推断“自然动作已验证”“可实时”“可商用”三个结论。

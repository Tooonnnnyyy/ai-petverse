# 开源技术路线：网页端真实宠物感（猫狗 MVP）

访问日期：2026-11-12（America/Toronto）。本笔记优先引用官方 GitHub README/API、官方文档和项目页；“可实现”表示有公开实现路径，不等同于已在本项目或所有浏览器上完成验证。

## 关键问题一：浏览器本地照片导入、主体分割与特征抽取，什么组合可以先做成 MVP？

### Takeaway
推荐先做“浏览器本地导入 → 轻量抠图 → 宠物裁剪/颜色与纹理特征 → 2D 分层卡片”的隐私优先 MVP。MediaPipe Tasks Web 和 ONNX Runtime Web 都提供浏览器内 WASM/GPU 路径；Transformers.js 可把 ONNX 视觉模型直接放进浏览器，但模型大小、下载和 WebGPU 兼容性应设为明确的渐进增强边界。

### Cited Findings
- MediaPipe Image Segmenter 的 Web SDK 通过 `@mediapipe/tasks-vision`、WASM fileset 与 `delegate: "GPU"` 支持 IMAGE/VIDEO 模式，并返回 category/confidence mask；官方示例明确给出 `segment()` 与 `segmentForVideo()` 调用。其官方页面也提供可运行 Web demo 和 StackBlitz 示例。[MediaPipe Image Segmenter Web](https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter/web_js)（访问：2026-11-12）
- MediaPipe 官方 `mediapipe-samples-web` 仓库列出 Image Segmentation、Interactive Segmentation、Image Embedding、Pose Landmarker 等 Web demo，README 标注 Apache-2.0；这使“照片导入后用户点一下修正主体”可作为后续交互路线。[mediapipe-samples-web README](https://github.com/google-ai-edge/mediapipe-samples-web)；[LICENSE](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/LICENSE)（访问：2026-11-12）
- MediaPipe 主仓库标注 Apache-2.0，并说明包含预训练、可运行模型及浏览器中可视化/测试/benchmark 的解决方案；数据是否离开设备取决于应用集成方式，不能仅凭仓库许可证推断模型权利。[MediaPipe repository](https://github.com/google-ai-edge/mediapipe)（访问：2026-11-12）
- ONNX Runtime Web 官方教程说明 `onnxruntime-web` 可在浏览器运行 ONNX，执行后端包括 WebGL、WebGPU、WebNN 与 WASM；WASM 支持全部 ONNX operators，而 WebGL/WebGPU/WebNN 当前只支持子集。官方还说明浏览器推理有隐私、离线和成本优势；模型过大或不希望下载到设备时可改用 `onnxruntime-node`/服务端。[ONNX Runtime Web tutorial](https://onnxruntime.ai/docs/tutorials/web/)（访问：2026-11-12）
- ONNX Runtime 主仓库许可证为 MIT；Transformers.js 仓库许可证为 Apache-2.0，并明确“无需服务器、直接在浏览器运行”，通过 ONNX Runtime 支持图像分类、目标检测、分割、深度估计和图像 embedding。它默认浏览器 CPU/WASM，也可 `device: 'webgpu'`，但官方 README 警告 WebGPU 在很多浏览器仍属 experimental。[ONNX Runtime](https://github.com/microsoft/onnxruntime)；[Transformers.js README](https://github.com/huggingface/transformers.js)（访问：2026-11-12）
- `rembg` 是 MIT 许可的 Python/CLI/HTTP 工具，使用 ONNX Runtime；README 列出可下载的 U²-Net、IS-Net、SAM、BiRefNet 等模型，并说明模型首次使用自动下载到本地。它是很实用的服务端 fallback，但仓库自身不是浏览器 JS 包，且每个模型的上游权利/用途条件需单独核查。[rembg README](https://github.com/danielgatis/rembg)；[rembg LICENSE](https://github.com/danielgatis/rembg/blob/master/LICENSE.txt)（访问：2026-11-12）
- U²-Net 仓库为 Apache-2.0，README 将其定位为 salient object detection，并给出 176.3 MB `u2net.pth`、4.7 MB `u2netp.pth` 等权重下载；它不是专门的猫狗分割模型，直接用于复杂毛发边缘可能产生硬边或漏毛，需要 alpha matting/边缘修补。[U²-Net README](https://github.com/xuebinqin/U-2-Net)；[U²-Net LICENSE](https://github.com/xuebinqin/U-2-Net/blob/master/LICENSE)（访问：2026-11-12）
- Hugging Face 的 `Xenova/clip-vit-base-patch32` 模型卡 API 标注 MIT、`transformers.js`/ONNX、zero-shot-image-classification，可作为“猫/狗、毛色、场景标签”的候选 embedding/classifier；模型卡没有证明它能可靠识别每只宠物的个体身份，故 MVP 应把输出写成候选/可编辑标签。[Xenova CLIP model card](https://huggingface.co/Xenova/clip-vit-base-patch32)（访问：2026-11-12）

### Inferences
- 最小可交付链路是：`<input type=file>` + `createImageBitmap` → MediaPipe Image Segmenter（优先 GPU，失败回退 WASM）→ mask 后处理（闭运算/羽化/裁剪）→ 保存本地 RGBA/Blob → DOM/CSS 或 Three.js billboard。这样不上传原图，首屏模型也可按需加载。
- 真实“宠物感”应先来自原图的轮廓、毛色、脸部局部纹理和耳尾比例，而不是声称模型已识别个体身份。embedding 可用于相似度/标签候选；把“品种、性格、情绪”作为用户确认后的元数据更稳妥。
- 可把 rembg/U²-Net/IS-Net/BiRefNet 置于可选服务端 API，供低端设备或毛发边缘失败时使用；服务端接口需明确原图保留、删除和缓存策略，且不可把上游模型权利简化成 rembg 的 MIT 许可。

### Gaps
- MediaPipe 官方 Image Segmenter 页面主要展示人物/背景类预训练模型，没有给出猫狗专用 mask 的准确率；猫狗毛发质量需用项目自有样本集实测。[官方页面](https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter/web_js)
- 本次资料没有发现一个同时具备“猫狗主体分割 + 浏览器可直接加载 + 明确商业模型许可 + 毛发 benchmark”的单一开源模型；因此应把模型选择和验收留为可替换层。

## 关键问题二：宠物姿态、行为映射和可持续的“个体特征”如何实现？

### Takeaway
浏览器端可直接采用 MediaPipe 的 Web task 基础设施，但官方 Pose Landmarker 是人体任务，不能直接当作猫狗骨架。猫狗姿态/行为应先走“少量手工控制点 + 预设动作曲线”，再将 MMPose、DeepLabCut 或自定义 AP-10K/Animal-Pose 模型放到服务端研究路径；这比承诺通用实时宠物姿态更符合当前证据。

### Cited Findings
- MediaPipe Pose Landmarker Web 文档说明输入为图像/视频，输出人体 pose landmarks 与 world landmarks；Web 示例使用 `@mediapipe/tasks-vision`、WASM、`pose_landmarker_lite.task`，IMAGE 是无状态单帧，VIDEO 按时间戳逐帧追踪，并可在 `requestAnimationFrame` 中处理最新视频帧。[Pose Landmarker Web](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js)（访问：2026-11-12）
- 官方 Web samples README 把 Pose Landmarker 描述为“Full-body pose tracking with segmentation support”，上下文仍是人体/通用视觉 demo；没有声称其为猫狗关键点模型。[mediapipe-samples-web README](https://github.com/google-ai-edge/mediapipe-samples-web)（访问：2026-11-12）
- MMPose 是 Apache-2.0 的 PyTorch pose toolbox；README 说明覆盖 2D/3D 人体、手、脸和自定义 pose 分析，模型/数据列表包含 Animal-Pose、AP-10K、Horse-10、ATRW 等动物数据集条目。它适合服务端/离线训练和导出 ONNX 的研究基座，但仓库本身不是浏览器运行时。[MMPose README](https://github.com/open-mmlab/mmpose)；[MMPose LICENSE](https://github.com/open-mmlab/mmpose/blob/main/LICENSE)（访问：2026-11-12）
- DeepLabCut 是 LGPL-3.0 的动物 markerless pose toolbox；README 说明可跟踪用户标注的动物身体部位、支持单/多动物，并提供 `SuperAnimal-Quadruped` 与 `SuperAnimal-TopViewMouse` 预训练模型。安装要求 Python 3.10+，典型路径是 Python/CUDA/GUI 或 Colab，而不是浏览器端推理。[DeepLabCut README](https://github.com/DeepLabCut/DeepLabCut)；[DeepLabCut LICENSE](https://github.com/DeepLabCut/DeepLabCut/blob/main/LICENSE)（访问：2026-11-12）
- SAM 2 仓库将其定义为图像/视频 promptable segmentation foundation model，提供 SAM 2.1 checkpoints；README 的许可段明确模型 checkpoint、demo 前后端和训练代码均 Apache-2.0。官方安装要求 Python >=3.10、PyTorch >=2.5.1、TorchVision >=0.20.1；公开 benchmark 是 A100 上 FPS，不是浏览器 benchmark。[SAM 2 README](https://github.com/facebookresearch/sam2)；[SAM 2 LICENSE](https://github.com/facebookresearch/sam2/blob/main/LICENSE)（访问：2026-11-12）
- SAM 2 的官方 README 给出 tiny/small/base+/large checkpoint 大小和 A100 速度，且说明视频 predictor 依赖 streaming memory；这适合“用户点选宠物后在视频中跟踪”研究，但不能据此推断低端浏览器实时可用。[SAM 2 model table](https://github.com/facebookresearch/sam2#model-description)（访问：2026-11-12）

### Inferences
- MVP 行为映射应避免“模型预测情绪”承诺：将输入映射为少数稳定动作状态（idle、blink、ear-up、tail-sway、look-at、sleep），由手工定义的耳朵/眼睛/尾巴控制点或 mask 轮廓驱动，保留一个 `confidence/unknown` 状态。
- 若用户提供多张照片，可用 CLIP/视觉 embedding 做“同一宠物候选相似度”，再由用户确认；个体特征应保存为可删除的本地 profile（颜色直方图、轮廓比例、embedding），而不是上传到公共模型。
- 研究版可用 DeepLabCut/MMPose 训练猫狗关键点，导出 ONNX 后以 ONNX Runtime Web 试跑；需先检查算子覆盖、模型体积和每设备 FPS，再决定是否进入浏览器默认路径。

### Gaps
- 未找到官方证据表明 MediaPipe Pose Landmarker 能直接输出猫狗关键点；人体模型不得被包装成宠物姿态模型。
- MMPose/DeepLabCut 的动物模型质量、猫与狗跨品种泛化和浏览器端延迟需要本项目数据集评测；官方 README 没有给出本产品所需的“单张宠物照片→稳定动作骨架”指标。
- “行为/情绪”标签与姿态关键点不是同一问题；本次资料没有可安全支持的通用宠物情绪识别模型结论。

## 关键问题三：2D/2.5D 动画、Three.js/React 渲染和后续高风险研究应如何分层？

### Takeaway
当前可交付的真实感来自透明 PNG/SVG 分层、轻微视差、骨骼/关键点插值和 Three.js/React 的可控渲染。Three.js、react-three-fiber、Drei 和 GaussianSplats3D 都有 MIT 许可实现；3D Gaussian Splatting 适合后续多视角/3D 研究，但它要求用户提供多视角数据、WebGL 资源和跨源隔离配置，不能作为单照片猫狗 MVP 的默认方案。

### Cited Findings
- Three.js 官方 README 将其定位为轻量、跨浏览器通用 3D library；当前 builds 包含 WebGL 和 WebGPU renderers，示例直接使用 `THREE.WebGLRenderer`。GitHub API 标注 MIT。[Three.js README](https://github.com/mrdoob/three.js)；[Three.js LICENSE](https://github.com/mrdoob/three.js/blob/dev/LICENSE)（访问：2026-11-12）
- `@react-three/fiber` GitHub API 标注 MIT；Drei 是 React Three Fiber 的 MIT helper 集合，README 给出 `npm install @react-three/drei`；这些适合把宠物 sprite、billboard、mesh、相机和交互状态放入 React 组件。[react-three-fiber](https://github.com/pmndrs/react-three-fiber)；[Drei](https://github.com/pmndrs/drei)（访问：2026-11-12）
- GaussianSplats3D 是 MIT 的 Three.js-based 3D Gaussian Splatting viewer，README 给出 NPM 包、`.ply/.splat/.ksplat` 加载、渐进加载以及与 Three.js scene/camera/renderer 集成示例。[GaussianSplats3D README](https://github.com/mkkellogg/GaussianSplats3D)；[LICENSE](https://github.com/mkkellogg/GaussianSplats3D/blob/main/LICENSE)（访问：2026-11-12）
- GaussianSplats3D README 说明默认排序可用 `SharedArrayBuffer`，需要 `Cross-Origin-Opener-Policy: same-origin` 与 `Cross-Origin-Embedder-Policy: require-corp` 才能保持 shared memory；也可关闭 shared memory，但会牺牲该路径的能力/性能。该约束会影响 GitHub Pages、CDN、iframe 和跨域资源部署。[GaussianSplats3D CORS/SharedArrayBuffer notes](https://github.com/mkkellogg/GaussianSplats3D#cors-issues-and-sharedarraybuffer)（访问：2026-11-12）
- `three-gpu-pathtracer` GitHub README 标注 MIT，但明确 WebGPU path tracer “not yet stable”、依赖可能变化的 `three-mesh-bvh` API，并要求锁定版本；它适合效果研究，不适合作为宠物 MVP 的基础渲染器。[three-gpu-pathtracer README](https://github.com/gkjohnson/three-gpu-pathtracer)（访问：2026-11-12）
- Gaussian Splatting 原始项目是从多张图像/视频重建 3D 场景的研究路线；GaussianSplats3D README 也把项目描述为从 2D images 生成可实时渲染 3D scenes 的 viewer，但其输入仍是 splat 文件而不是一张普通宠物照片。[GaussianSplats3D README](https://github.com/mkkellogg/GaussianSplats3D)；[原始 3D Gaussian Splatting 项目](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/)（访问：2026-11-12）

### Inferences
- MVP 渲染建议：一张抠图作为主体层，另建眼睛/耳朵/尾巴或高光层；用 CSS/Canvas/Three.js 做 2.5D parallax、呼吸缩放、眨眼、耳尾摆动和光照渐变。React Three Fiber 只负责场景/相机/交互状态，动作时间轴由纯 JS/TypeScript 曲线控制，便于在没有姿态模型时稳定运行。
- 对照片细节要求较高时，可保留一个 WebGL `CanvasTexture`/sprite 路径作为低风险默认；WebGPU renderer、GPU path tracing 和 Gaussian Splatting 应放在 feature flag 后面，以便按浏览器能力和设备性能逐级启用。
- 2.5D 的深度估计可以先用手工分层（耳/脸/身体/影子）或可选 monocular depth 模型；不要把单张照片推断出的深度当成真实几何。Gaussian Splatting 只有在用户提供足够多的环绕照片/视频并接受更大资源下载时才值得进入实验。

### Gaps
- 未发现可直接把“一张猫狗照片”自动变成可编辑、拓扑正确、可驱动 3D rig 的宽许可浏览器方案；单图 3D reconstruction/rigging 仍是高风险研究。
- WebGPU/WebGL 性能依设备和浏览器变化；仓库的 A100 或桌面 benchmark 不能替代本项目在 Safari/Chrome 移动设备的实测。
- 第三方模型权利可能独立于代码许可证（尤其 Hugging Face checkpoint、训练数据和商业使用条款）；发布前必须逐模型保存 LICENSE、model card、权重 URL 和版本哈希。

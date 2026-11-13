# GitHub ecosystem for AI Petverse

访问日期：2026-11-12（America/Toronto）。本笔记只读检查 GitHub API/CLI 与公开仓库 README、代码目录、release、LICENSE；没有克隆、运行、修改或删除任何项目。star 数、README 宣传和在线 demo 只作为发现线索，不当作身份保持、动作质量或生产可靠性的成功证据。

## 本地 gh 可见范围：个人 repos、starred、following

### Takeaway
当前 `gh` 登录账号为 `Tooonnnnyyy`；可见个人仓库中有 9 个公开且非 fork，`ai-petverse` 是公开 MIT 仓库。starred 与 following 提供了直接相关的线索（MediaPipe、Gaussian Splatting、ML-SHARP、pixelpets、React/Three.js 生态、OpenCV/TensorFlow/Hugging Face 等），但账户关注或收藏不等于已验证可复用。

### Cited Findings
- GitHub 个人资料显示 `Tooonnnnyyy`、公开仓库数量与个人主页入口；公开仓库列表可在 Repositories 页核对。 — [Profile](https://github.com/Tooonnnnyyy) · [Repositories](https://github.com/Tooonnnnyyy?tab=repositories)
- 只读 `gh repo list --limit 100 --json visibility,isFork,nameWithOwner` 结果中，9 个公开且非 fork 的个人仓库为 `ai-petverse`、`first-chapter`、`museos`、`meme-recognition`、`ideamap-obsidian`、`Tooonnnnyyy`、`vibe-remix`、`bearing-cnn`、`tony-knowledge-garden`；API 列表同时显示 `ai-petverse` 的公开状态、描述与 URL。 — [Repositories](https://github.com/Tooonnnnyyy?tab=repositories) · [AI Petverse](https://github.com/Tooonnnnyyy/ai-petverse)
- `ai-petverse` 的当前 GitHub API 元数据为 public、默认分支 `main`、MIT、描述为 “Immersive low-poly 3D pet companion for iOS, built with SwiftUI and SceneKit”，本次读取的远程最新提交为 `036643c97b92e7a2c817c6590871ad0b2acad407`；无 release 条目。 — [Repository](https://github.com/Tooonnnnyyy/ai-petverse) · [Commit](https://github.com/Tooonnnnyyy/ai-petverse/commit/036643c97b92e7a2c817c6590871ad0b2acad407) · [Releases](https://github.com/Tooonnnnyyy/ai-petverse/releases)
- AI Petverse README 明确写明当前 P0 是本地、确定性的 procedural low-poly SceneKit 宠物；不宣称 photo-to-3D reconstruction 或 hosted AI generation service，照片仍留在设备端，后续 provider seam 尚未接入。 — [README](https://github.com/Tooonnnnyyy/ai-petverse/blob/036643c97b92e7a2c817c6590871ad0b2acad407/README.md)
- Starred 页中与本任务直接相关的条目包括 `google-ai-edge/mediapipe`、`graphdeco-inria/gaussian-splatting`、`apple-aiml-research/ml-sharp`、`JOhnsonKC201/pixelpets`、`remotion-dev/remotion`、`storytold/photocraft`、`react/react`、`ayangweb/BongoCat` 等；完整当前列表以账户 Stars 页为准。 — [Starred repositories](https://github.com/Tooonnnnyyy?tab=stars)
- Following 页显示关注了 `opencv`、`tensorflow`、`huggingface`、`react`、`vercel`、`googlecolab`、`keras-team`、`ayangweb`、`QwenLM`、`ByteDance-Seed`、`meituan-longcat` 等生态账号；following 是发现来源，不是验证结果。 — [Following](https://github.com/Tooonnnnyyy?tab=following)

### Inferences
- AI Petverse 当前最清晰的可复用边界是 iOS/SceneKit 本地交互壳；真实宠物 likeness、姿态跟踪、视频驱动和照片到 3D 仍应当作为独立证据链接入。
- 账户生态线索适合优先验证 MediaPipe/SAM2（分割）、SLEAP/DeepLabCut（行为关键点）、LivePortrait（动物视频驱动）、TripoSR/SHARP（单图几何/新视角）与 React Three Fiber（Web 展示），而不是依据收藏数量选型。

### Gaps
- `gh` 可见的私有仓库名称和 starred 数量不能推断其内容或许可；本次未读取私有文件，也未改变 GitHub 状态。
- API 最新提交与 release 会变化；以上 commit、release 和访问时间是本次快照，后续使用前需重查。

## 宠物照片、动物姿态、分割与视频驱动

### Takeaway
公开项目中，LivePortrait 是最直接的猫狗照片/视频动画候选；SLEAP 与 DeepLabCut 适合把真实宠物行为转成关键点/轨迹；SAM 2 与 MediaPipe 提供可嵌入的图像/视频分割和跨平台 Web/移动推理基础。它们解决的是不同阶段，不能互相替代。

### Cited Findings
- **LivePortrait（KlingAIResearch/LivePortrait）**：README 将其描述为官方 PyTorch portrait animation 实现；2025-01 更新 Animals model，支持 cats/dogs，且列出 image-driven、regional control、v2v 与 Animals mode；当前读取 commit `9b294b3d0536135442ea73cb01e6cb3ca7029dd3`，无 GitHub release。 — [README at commit](https://github.com/KlingAIResearch/LivePortrait/blob/9b294b3d0536135442ea73cb01e6cb3ca7029dd3/readme.md) · [Animals changelog](https://github.com/KlingAIResearch/LivePortrait/blob/9b294b3d0536135442ea73cb01e6cb3ca7029dd3/assets/docs/changelog/2025-01-01.md) · [Releases](https://github.com/KlingAIResearch/LivePortrait/releases)
- LivePortrait 的仓库 API 未标 SPDX license，但仓库 `LICENSE` 是 MIT；同一文件说明 InsightFace detection models 是 non-commercial research only，商业使用需替换这些模型。因此“代码 MIT”不能直接等同于“默认权重和检测模型可商业使用”。 — [Repository metadata](https://github.com/KlingAIResearch/LivePortrait) · [LICENSE](https://raw.githubusercontent.com/KlingAIResearch/LivePortrait/9b294b3d0536135442ea73cb01e6cb3ca7029dd3/LICENSE)
- **SLEAP（talmolab/sleap）**：README 说明可跟踪任意类型/数量动物，提供 labeling/training GUI、active learning、single/multi-animal top-down 与 bottom-up pose estimation；读取 commit `52ad6a15ff32e11c4b4e3b7f99a3c0abb463127f`，最新 release `v1.6.6`（2026-10-20），许可证 BSD-3-Clause-Clear。 — [README at commit](https://github.com/talmolab/sleap/blob/52ad6a15ff32e11c4b4e3b7f99a3c0abb463127f/README.md) · [Release v1.6.6](https://github.com/talmolab/sleap/releases/tag/v1.6.6) · [License](https://github.com/talmolab/sleap/blob/52ad6a15ff32e11c4b4e3b7f99a3c0abb463127f/LICENSE)
- **DeepLabCut（DeepLabCut/DeepLabCut）**：README 称其为对所有动物和人类的 markerless、user-defined feature pose estimation；支持 animal/object agnostic labeling，当前读取 commit `fa5a8c36100c85300b7d4a534deb38d7bd8b2fa8`，release `v3.0.2`（2026-09-23），许可证 LGPL-3.0。 — [README at commit](https://github.com/DeepLabCut/DeepLabCut/blob/fa5a8c36100c85300b7d4a534deb38d7bd8b2fa8/README.md) · [Release v3.0.2](https://github.com/DeepLabCut/DeepLabCut/releases/tag/v3.0.2) · [License](https://github.com/DeepLabCut/DeepLabCut/blob/fa5a8c36100c85300b7d4a534deb38d7bd8b2fa8/LICENSE)
- **SAM 2（facebookresearch/sam2）**：README 说明它是 promptable image/video segmentation foundation model，使用 streaming memory 做视频处理，并公开 web demo 前后端；当前 commit `2b90b9f5ceec907a1c18123530e92e794ad901a4`，许可证 Apache-2.0，无 GitHub release。安装要求 Python >=3.10、PyTorch >=2.5.1，部分路径需要 CUDA 编译，意味着 iOS 端直接嵌入不是现成路径。 — [README at commit](https://github.com/facebookresearch/sam2/blob/2b90b9f5ceec907a1c18123530e92e794ad901a4/README.md) · [License](https://github.com/facebookresearch/sam2/blob/2b90b9f5ceec907a1c18123530e92e794ad901a4/LICENSE)
- **MediaPipe（google-ai-edge/mediapipe）**：README 标明跨平台（Android、iOS、Web、desktop、edge、IoT），提供 Web demos、Python/Web setup 与预训练 ready-to-run models；当前 commit `eb58dea48db39bd41314e4df36fd93138ebeae84`，release `v1.2.3`（2026-11-11），许可证 Apache-2.0。 — [README at commit](https://github.com/google-ai-edge/mediapipe/blob/eb58dea48db39bd41314e4df36fd93138ebeae84/README.md) · [Release v1.2.3](https://github.com/google-ai-edge/mediapipe/releases/tag/v1.2.3) · [License](https://github.com/google-ai-edge/mediapipe/blob/eb58dea48db39bd41314e4df36fd93138ebeae84/LICENSE)
- **PixelPets（JOhnsonKC201/pixelpets）**：这是可运行的交互桌面宠物产品参考，不是 likeness/ML 模型。README 说明 Windows/macOS 下载与 browser demo，包含猫/Black Lab、鼠标/键盘/拖拽/滚动反应和 mood 状态；当前 commit `d8ff599c21722d8ab313a44ff656890202beabcd`，release `v0.4.0`（2026-08-26），MIT。README 还明确 installers 未 code-sign，macOS beta 未在真实 Mac 上验证。 — [README at commit](https://github.com/JOhnsonKC201/pixelpets/blob/d8ff599c21722d8ab313a44ff656890202beabcd/README.md) · [Release v0.4.0](https://github.com/JOhnsonKC201/pixelpets/releases/tag/v0.4.0) · [License](https://github.com/JOhnsonKC201/pixelpets/blob/d8ff599c21722d8ab313a44ff656890202beabcd/LICENSE)

### Inferences
- 真实宠物 MVP 可按阶段组合：MediaPipe/SAM2 做输入分割与视频 mask；SLEAP/DeepLabCut 做用户可标注的身体关键点与行为轨迹；LivePortrait 做照片驱动短视频；最终由 SceneKit 或 Web/Three.js 播放动作。每个仓库的模型输入、设备要求、权重许可和输出格式都需单独适配。
- LivePortrait 的 Animals model 是与宠物最直接的候选，但其第三方 InsightFace 权重的 non-commercial 条款是商业上线的阻塞点，需先替换 detector 或取得明确许可。

### Gaps
- 未在本机安装或运行这些模型；没有把 README 的“支持猫狗/实时/高效”升级成宠物身份保持、动作保真、延迟或准确率结论。
- SLEAP/DeepLabCut 的训练数据和关键点 schema 需要针对每只宠物设计；仓库 README 没有证明对某一只用户宠物的零样本 likeness。

## 单图/多视图 3D、Gaussian 与模型许可

### Takeaway
TripoSR、SHARP、Stable Fast 3D、Hunyuan3D-2 能作为照片到几何/材质的研究候选，但许可和设备条件差异很大；Gaussian Splatting、Neurecon、DVLT更适合多视图重建研究，不能把单张宠物照直接当作可靠的完整 3D identity。模型权重许可必须与代码许可分开审查。

### Cited Findings
- **TripoSR（VAST-AI-Research/TripoSR）**：README 说是 single-image feed-forward 3D reconstruction，公开 source code、pretrained models、online demo 均在 MIT license 下；支持多张输入、约 6GB VRAM 单图默认路径；读取 commit `107cefdc244c39106fa830359024f6a2f1c78871`，无 GitHub release。 — [README at commit](https://github.com/VAST-AI-Research/TripoSR/blob/107cefdc244c39106fa830359024f6a2f1c78871/README.md) · [License](https://github.com/VAST-AI-Research/TripoSR/blob/107cefdc244c39106fa830359024f6a2f1c78871/LICENSE)
- **Stable Fast 3D（Stability-AI/stable-fast-3d）**：README 描述 single-image mesh reconstruction、UV unwrapping、material parameters，并基于 TripoSR；读取 commit `ff21fc491b4dc5314bf6734c7c0dabd86b5f5bb2`。其 `LICENSE.md` 是 Stability AI Community License：商业用途须注册，年收入超过 USD 1M 时许可终止并需 enterprise license，还要求 “Powered by Stability AI” 等通知；API SPDX 为 NOASSERTION，不能按 MIT 使用。 — [README at commit](https://github.com/Stability-AI/stable-fast-3d/blob/ff21fc491b4dc5314bf6734c7c0dabd86b5f5bb2/README.md) · [Community License](https://github.com/Stability-AI/stable-fast-3d/blob/ff21fc491b4dc5314bf6734c7c0dabd86b5f5bb2/LICENSE.md)
- **Hunyuan3D-2（Tencent-Hunyuan/Hunyuan3D-2）**：README 列出 shape/paint、multiview shape、PBR 与 multiview texture pipeline；读取 commit `f8db63096c8282cb27354314d896feba5ba6ff8a`。仓库 license 明确排除 EU、UK、South Korea territory，并对第三方分发/Hosted Service、Notice、品牌披露和 >1M MAU 设置条件；API SPDX 为 NOASSERTION。 — [README at commit](https://github.com/Tencent-Hunyuan/Hunyuan3D-2/blob/f8db63096c8282cb27354314d896feba5ba6ff8a/README.md) · [License](https://github.com/Tencent-Hunyuan/Hunyuan3D-2/blob/f8db63096c8282cb27354314d896feba5ba6ff8a/LICENSE)
- **SHARP（apple-aiml-research/ml-sharp）**：README 说明从单张照片回归 3D Gaussian representation，近邻视角实时渲染；读取 commit `aed6527499ef91cba3b54c18d49a870f25947190`。代码 `LICENSE` 允许源代码再分发，但 `LICENSE_MODEL` 把模型/权重/派生模型限制为 non-commercial scientific research，API SPDX 为 NOASSERTION。 — [README at commit](https://github.com/apple-aiml-research/ml-sharp/blob/aed6527499ef91cba3b54c18d49a870f25947190/README.md) · [Code license](https://github.com/apple-aiml-research/ml-sharp/blob/aed6527499ef91cba3b54c18d49a870f25947190/LICENSE) · [Model license](https://github.com/apple-aiml-research/ml-sharp/blob/aed6527499ef91cba3b54c18d49a870f25947190/LICENSE_MODEL)
- **Gaussian Splatting（graphdeco-inria/gaussian-splatting）**：README 是多照片/视频的 3D Gaussian real-time radiance-field reference implementation，提供 COLMAP 数据、预训练模型与 viewer；读取 commit `54c035f7834b564019656c3e3fcc3646292f727d`。其 LICENSE.md 说明研究用途授权、软件仍在开发，API SPDX 为 NOASSERTION；无 GitHub release。 — [README at commit](https://github.com/graphdeco-inria/gaussian-splatting/blob/54c035f7834b564019656c3e3fcc3646292f727d/README.md) · [License](https://github.com/graphdeco-inria/gaussian-splatting/blob/54c035f7834b564019656c3e3fcc3646292f727d/LICENSE.md)
- **Neurecon（ventusff/neurecon）**：README 实现 UNISURF、VolSDF、NeuS 等 multi-view neural rendering，明确输入是 posed images；读取 commit `972e810ec252cfd16f630b1de6d2802d1b8de59a`，MIT，无 GitHub release。它是研究重建管线，不是宠物专用模型，也不提供单图完整性保证。 — [README at commit](https://github.com/ventusff/neurecon/blob/972e810ec252cfd16f630b1de6d2802d1b8de59a/README.md) · [License](https://github.com/ventusff/neurecon/blob/972e810ec252cfd16f630b1de6d2802d1b8de59a/LICENSE)
- **DVLT（nv-tlabs/dvlt）**：README 描述从无序多视图预测 rays、depth、confidence、camera poses，公开 model weights 和评估数据加载器；读取 commit `f59bb18259ab446a7585c4f47731a77cfdefa426`，无 GitHub release。代码主要 Apache-2.0，但 README/LICENSE 明确 model checkpoint 单独受 NVIDIA License，限 non-commercial research/evaluation。 — [README at commit](https://github.com/nv-tlabs/dvlt/blob/f59bb18259ab446a7585c4f47731a77cfdefa426/README.md) · [License](https://github.com/nv-tlabs/dvlt/blob/f59bb18259ab446a7585c4f47731a77cfdefa426/LICENSE) · [NVIDIA model license](https://github.com/nv-tlabs/dvlt/blob/f59bb18259ab446a7585c4f47731a77cfdefa426/LICENSES/NVIDIA-LICENSE.txt)

### Inferences
- 对 AI Petverse 的实际路线，TripoSR（MIT）最适合先做研究性单图 baseline；若需要材质/UV，可评估 Stable Fast 3D，但其 Community License 需要产品/商业审查；Hunyuan3D-2 的地域排除会影响面向 EU、UK、South Korea 的产品分发，因此全球发布存在额外许可风险（加拿大本身未被该条款排除）。
- 多视图捕获（宠物转圈视频/多角度照片）比单图更适合保护个体外观，但 Gaussian/Neurecon/DVLT 的输入、训练、相机姿态和硬件要求意味着它们更像研究管线，而不是直接可嵌入 iOS P0。

### Gaps
- 未对任一 3D 模型下载权重、生成 mesh/gaussian 或测量宠物 likeness；没有真实宠物数据集上的定量比较。
- Hunyuan、Stable Fast 3D、SHARP、DVLT 的代码/模型/输出条款存在分层许可；接入前需对目标部署地区、商业状态、分发模式分别取得法律/产品确认。

## Web/React/Three.js 与可复用交互参考

### Takeaway
React Three Fiber 是最直接的 Web/React 3D 渲染底座；BongoCat 和 PixelPets 展示了跨平台互动宠物的输入映射、状态反馈与发布方式；img2threejs 提供了“从参考图生成可动画 Three.js procedural model”的工程化思路，但其 README 明确它不是 photogrammetry/mesh extraction，不能代替真实宠物重建。

### Cited Findings
- **React Three Fiber（pmndrs/react-three-fiber）**：README 将其定义为 React renderer for Three.js，组件可复用、可响应 state/input，并给出 `npm install three @types/three @react-three/fiber` 与 React 18/19 对应版本说明；读取 commit `d74622ea8ed717f7212d7e19d65ff3e325508389`，release `v9.8.2`，MIT。 — [README at commit](https://github.com/pmndrs/react-three-fiber/blob/d74622ea8ed717f7212d7e19d65ff3e325508389/README.md) · [Release v9.8.2](https://github.com/pmndrs/react-three-fiber/releases/tag/v9.8.2) · [License](https://github.com/pmndrs/react-three-fiber/blob/d74622ea8ed717f7212d7e19d65ff3e325508389/LICENSE)
- **BongoCat（ayangweb/BongoCat）**：README 说明跨平台桌面宠物，对鼠标、键盘、gamepad 输入作反应，支持自带 Live2D models 和独立 models 社区；读取 commit `47a73ed1765b13fdd674ec356d51b5b16a6b5a5b`，release `v2.4.1`（2026-10-28），Apache-2.0。它是输入/桌面壳参考，不是照片 likeness 或 3D reconstruction。 — [README at commit](https://github.com/ayangweb/BongoCat/blob/47a73ed1765b13fdd674ec356d51b5b16a6b5a5b/README.md) · [Release v2.4.1](https://github.com/ayangweb/BongoCat/releases/tag/v2.4.1) · [License](https://github.com/ayangweb/BongoCat/blob/47a73ed1765b13fdd674ec356d51b5b16a6b5a5b/LICENSE)
- **img2threejs（img2threejs/img2threejs）**：README 把项目定义为从参考图重建 code-only、procedural、animation-ready Three.js model，运行在浏览器并提供 source gallery；它明确写明不是 photogrammetry、mesh extraction 或下载 art packs，并列出 Mars Cat procedural demo；读取 commit `0c0c49bc168e648dbaf9c8c080474de0b3a941b6`，release `v2.0.1`（2026-11-05），Apache-2.0。可复用点是 procedural hierarchy/animation 和浏览器 QA，不是照片级身份保证。 — [README at commit](https://github.com/img2threejs/img2threejs/blob/0c0c49bc168e648dbaf9c8c080474de0b3a941b6/README.md) · [Release v2.0.1](https://github.com/img2threejs/img2threejs/releases/tag/v2.0.1) · [License](https://github.com/img2threejs/img2threejs/blob/0c0c49bc168e648dbaf9c8c080474de0b3a941b6/LICENSE)
- **PixelPets** 的 browser demo、动作/情绪状态和“no account/no upload”产品说明可作为 AI Petverse Web preview 的 interaction reference；该仓库本身是 MIT，但其 README 只证明作者自述的产品行为，未证明任何跨设备性能或宠物身份保持。 — [README](https://github.com/JOhnsonKC201/pixelpets/blob/d8ff599c21722d8ab313a44ff656890202beabcd/README.md) · [Browser demo](https://pixelcat-jet.vercel.app)

### Inferences
- 如果要做浏览器可玩 preview，可把 React Three Fiber + procedural SceneKit parity + LivePortrait/SAM2 server seam 组合起来：前端负责可访问的 3D 状态/动作与 fallback，模型服务负责照片分割、动作驱动或离线几何生成；这一拆分与 AI Petverse 当前“本地 avatar preview + future provider seam”较一致。
- img2threejs 的 procedural approach 能提供稳定的动画层级和无资产下载的 demo，但要把“本人宠物”可信度作为单独的 photo/multi-view evidence gate，不能用 procedural resemblance 代替。

### Gaps
- 未检查这些项目在 iOS Safari、GitHub Pages 或 AI Petverse 现有构建中的真实兼容性；未做 bundle size、FPS、WebGL fallback、内存、隐私或端到端延迟测试。
- 未找到一个同时满足“宠物照片身份保持 + 3D 可编辑模型 + 商业友好许可证 + React/Three.js 可直接运行”的单一公开仓库；需要组合管线并分别验证。

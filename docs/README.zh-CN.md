# AI Petverse（中文）

[English](../README.md)

AI Petverse 是一个 iOS 优先的宠物数字伙伴原型：用户可以拍照或上传宠物图片，进入一个全屏、低多边形、沉浸式 3D 世界。视觉方向结合体素游戏与《纪念碑谷》式几何场景。

## 当前可用功能

- 使用相机或照片库输入，也可以使用预设模板快速体验。
- 本地、确定性的头像预览；源照片保留在设备上。
- 使用 SceneKit 程序化生成低多边形宠物，并直接放入 3D 世界。
- 两个可切换场景：**Pixel Grove**（体素农场）和 **Neon Arcade**（Y2K 霓虹街机）。
- `Play together` 会让 3D 宠物跳跃，并更新 Mood、Energy、Bond。
- 本地保存、删除、系统分享入口、取消、重试和互动冷却逻辑。

当前 P0 **不宣称**已经实现照片到 3D 网格的重建，也不包含托管的 AI 生成服务。照片输入和生成服务接口为未来接入 provider 保留；当前交付的 3D 宠物是由样式和外观控制驱动的程序化低多边形模型。

## Tech Stack

| 层 | 技术 |
| --- | --- |
| App | Swift 6、Xcode project、iOS 17+ |
| UI | SwiftUI |
| 3D 世界 | SceneKit、程序化低多边形几何体、正交相机 |
| 输入 | PhotosUI、UIKit camera bridge |
| 本地状态 | Codable models、UserDefaults persistence |
| 导出 | UIKit `UIActivityViewController` share-sheet bridge |
| 测试 | iOS Simulator 上的 XCTest |
| 依赖 | 仅 Apple frameworks，无第三方 package |

## 环境与运行

### 要求

- macOS 和 Xcode；当前 project settings 推荐使用 Xcode 27。
- iOS 17 或更新版本的 Simulator。真机运行需要自己的 signing team 和 provisioning 配置。
- P0 不需要 backend、账号、API key、付费服务或 `.env` 文件。`.env` 已被 Git 忽略，为未来 provider 凭据预留安全边界。

### 打开项目

```bash
open "AI Petverse.xcodeproj"
```

在 Xcode 里选择 `AI Petverse` scheme 和 iOS 17+ Simulator，点击 Run。相机和照片库权限文案已经写入 `AI Petverse/Info.plist`。

### 命令行测试

```bash
xcodebuild -project "AI Petverse.xcodeproj" \
  -scheme "AI Petverse" \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  CODE_SIGNING_ALLOWED=NO test
```

当前已验证：**11 个测试通过，0 个失败**。只编译不运行测试时，将 `test` 改为 `build`，并使用 `-destination 'generic/platform=iOS Simulator'`。

## 仓库结构

- [`AI Petverse/`](../AI%20Petverse) — SwiftUI screens、local store、SceneKit world builder 和 avatar preview seam。
- [`AI PetverseTests/`](../AI%20PetverseTests) — model、persistence、generation、interaction、scene selection 测试。
- [`docs/PROJECT_SETUP.md`](PROJECT_SETUP.md) — 环境、Simulator、签名和排错说明。
- [`docs/PROJECT_GOVERNANCE.md`](PROJECT_GOVERNANCE.md) — public repo 发布和 branch policy。
- [`docs/evidence/`](evidence) — 本地 Simulator review 截图。

## 版本与回退

当前沉浸式 3D 版本是 commit `2c60530`。上一版稳定的 local-avatar checkpoint 仍保留：

- branch：`backup/pre-3d-mvp`
- tag：`mvp-2d-stable-58df1bf`

未来开发使用 feature branch，通过 pull request 合并到受保护的 `main`。

## 隐私边界

当前原型不会上传源照片、调用 AI provider 或自动发布内容。打开系统分享面板只表示用户发起了分享意图，不代表外部服务已经收到文件。不要把 API key、webhook URL、私人路径、Simulator 数据或真实用户照片加入仓库。

## License

MIT，见 [`LICENSE`](../LICENSE)。

# AI Petverse Browser MVP - Product Requirements

**Status:** Planning only. No browser implementation is included in this document.

**Product decision:** Build the smallest real online experience first. The web
app is the primary surface; the Chrome extension is a thin companion and must
not delay the first usable web release.

## 1. Product promise

AI Petverse helps a person regain a little mental space through a familiar
digital pet that is grounded in how their real cat or dog behaves.

The product is not only a cute pet website, a generic chatbot, a diagnosis
tool, or a productivity assistant. The pet is the interaction layer. The first
release should prove whether a user can recognize their own pet's preferences
and feel a small, useful change after a short interaction.

> A real, rough, reviewable MVP with feedback and behaviour data is more
> valuable than a better idea that has not been brought down to earth.

This is a support and reflection product, not medical treatment, crisis care,
or a replacement for professional help.

## 2. Target user and job to be done

### Primary user

People who experience cognitive overload, anxiety, distraction, or difficulty
starting a small task and who already have a strong relationship with a cat or
dog.

### Job to be done

When I feel overloaded or stuck, I want a familiar pet-like interaction that
responds in a believable way and helps me pause, start, continue, or reset.

### Interview-ready outcome

The builder can show:

- a live URL that another person can open;
- the source repository and architecture;
- a pet profile created from explicit user answers;
- a visible pet response to a short user request;
- a feedback record showing whether the response felt like the real pet;
- behaviour data and at least one change made from that evidence;
- clear limitations and unverified claims.

## 3. Product principles

1. **Ship the smallest complete loop.** Reduce scope before adding another
   impressive feature.
2. **Real-pet likeness is the core hypothesis.** Appearance is useful, but
   behaviour, timing, boundaries, and preferences are more important for the
   first test.
3. **Observed facts outrank generic AI assumptions.** User corrections must
   override breed stereotypes or model guesses.
4. **AI interprets; code controls.** A model may classify an utterance, but a
   deterministic policy chooses the allowed behaviour and the renderer owns
   animation.
5. **Uncertainty is visible.** Low-confidence interpretation should ask,
   soften, or fall back rather than pretend to understand.
6. **User control is explicit.** Camera, microphone, uploads, and extension
   access are opt-in and visible.
7. **The pet should not react maximally to everything.** Pauses, delayed
   responses, rest, ignoring, and changing attention make the interaction more
   believable.
8. **Evidence boundaries stay separate.** A local build is not a live release;
   an event write is not proof of a helpful outcome; a model answer is not a
   fact.
9. **Deep personalization is progressive.** The first login may start a richer
   questionnaire, but questions are grouped, resumable, and editable. Do not
   force a distressed or overloaded user through a giant form before any useful
   interaction.

## 4. P0 scope

### Web app - required for the first public review URL

1. **Account and progressive onboarding**
   - Sign in before saving a pet profile so the profile can evolve across
     sessions. Use a low-friction provider such as email magic link; do not
     require a long account form.
   - Choose `cat` or `dog`, enter a pet name, then complete a core set of
     questions before the first interaction: energy, approach style, comfort
     signal, trigger or boundary, favourite activity, and a correction such as
     "hides when startled".
   - Offer deeper optional groups for routine, body language, sounds, habits,
     appearance, and owner preferences. Save progress and let the user revise
     answers over time.
   - A preset demo may be available for interview or review access, but it must
     be clearly labelled as a demo rather than a real personalized avatar.
2. **Pet profile summary**
   - Show facts supplied by the user.
   - Show corrections separately.
   - Do not silently convert an AI inference into a fact.
3. **Interactive pet scene**
   - One small browser scene with a controllable cat or dog.
   - The pet has idle, watch, approach, settle, play, rest, and hide states.
   - The pet has bounded energy, arousal, curiosity, trust, and cooldown values.
   - The pet can delay, ignore, or choose a lower-energy response.
4. **Three support actions**
   - `Come here` / proximity.
   - `I feel overwhelmed` / comfort and settle.
   - `Let's play` / short play interaction.
   - Typed input is always available. Click-to-talk speech is optional when the
     browser supports it and must have a typed fallback.
5. **Correction and feedback**
   - `Felt like my pet`, `Partly`, or `Did not feel like my pet`.
   - Optional correction: what did the pet get wrong?
   - Optional usefulness question: did this help you pause, start, continue,
     or reset?
6. **Minimal anonymous behaviour events**
   - The user can complete the loop without creating an account.
   - The app records only the fields needed for the next product decision.

### Chrome extension - P0.5 companion

The extension starts after the web loop works. It is a Manifest V3 popup opened
by the user from the toolbar.

- Show the current pet name and one small action: `Ground me` or `Help me
  start`.
- Link back to the web app for the full scene and profile correction.
- Store only a small profile summary locally or retrieve it from the web app.
- Do not request page-content, history, tab-capture, or microphone permissions
  in the first extension build.
- Do not monitor browsing, infer distress from browsing behaviour, or run as an
  always-on assistant.

## 5. P0 non-goals

Do not put these on the critical path:

- exact photo-to-3D reconstruction;
- photorealistic animation or live video generation;
- reliable emotion detection from a face or voice;
- always-on camera, microphone, screen capture, or page surveillance;
- social feeds, stranger messaging, payments, or subscriptions;
- UGC pet park and pet-to-pet socialization;
- long-term memory that stores private conversations by default;
- importing personal documents or becoming a general productivity assistant;
- a one-to-one port of every existing SwiftUI screen and RealityKit scene.

## 6. Pet profile and truth model

The first schema should keep three sources distinct:

```text
PetProfile
  identity: species, name, lifeStage, optional breed
  appearance: optional coat and marking selections
  preferences: likes, dislikes, favourite activities
  behaviour: energy, approachStyle, comfortSignal, trigger, boundaries
  corrections: user-authored corrections with timestamps
  inferences: optional model suggestions with confidence and status
```

Priority when the app chooses behaviour:

```text
user correction > user-provided fact > accepted inference > generic default
```

An inference must be labelled `inferred`, have a confidence/status field, and
be removable. The behaviour policy must never write a new memory merely because
an AI response mentioned it.

### What "exactly real" means technically

One photo cannot reliably produce an exact, rigged, walkable 3D copy of a real
pet. AI Petverse should measure perceptual likeness in three separate layers:

1. **Visual identity:** species, coat colours, markings, face shape, body
   proportions, eyes, ears, tail, and distinctive patterns.
2. **Behaviour identity:** greeting style, approach distance, energy rhythm,
   play preferences, hiding or avoidance, sounds, and reactions to touch or
   interruption.
3. **Relationship identity:** what this owner finds comforting, what the owner
   does not want the pet to do, and how the pet should respond during a support
   moment.

The first avatar can be a controllable base rig with AI-assisted appearance
parameters and user corrections. A later photo-grounded version can accept
three to five guided photos with explicit upload consent, extract appearance
attributes, and generate or texture a rigged asset. The product must say
`photo-grounded approximation` until user evaluation supports a stronger claim.

The most important fidelity loop is:

```text
profile + optional photos
  -> AI extraction with uncertainty
  -> owner confirmation/correction
  -> versioned avatar traits
  -> behaviour policy and animation
  -> likeness feedback
  -> reviewed profile update
```

Do not create a hidden model that remembers every camera frame, conversation,
or emotional signal. Store structured facts, corrections, consent, avatar
versions, and feedback outcomes instead.

## 7. Multimodal input and standardized gestures

When the user explicitly opens the webcam, the browser should convert local
landmarks into a small, versioned event vocabulary rather than sending raw
frames to the pet policy:

```ts
type GestureEvent = {
  name: "wave" | "nod" | "shake_head" | "open_hand" | "point" | "hand_raise";
  phase: "start" | "hold" | "end";
  confidence: number;
  timestamp: number;
  source: "webcam";
  schemaVersion: 1;
};
```

MediaPipe Tasks Vision or an equivalent browser landmark library can provide
hand, face, and pose landmarks locally. A gesture adapter should normalize
coordinate systems, apply temporal smoothing, require a minimum confidence, and
debounce repeated events. The behaviour policy consumes `GestureEvent`, not
model-specific landmark arrays.

Emotion must be handled more conservatively:

- explicit user text or a selected mood is the primary signal;
- optional speech or webcam cues may be weak, local, and labelled uncertain;
- the app must not claim it knows the user's true emotion;
- a low-confidence affect signal should result in a neutral or user-confirmed
  action, not a strong pet reaction;
- raw video and audio are not retained by default.

## 8. Community publishing

Users may eventually publish a digital pet so other people can view or interact
with it, but publication must be a separate public projection of a private
profile:

- private profile is the source of truth;
- public pet card contains only fields the owner selects;
- raw photos, owner identity, private corrections, conversations, and inferred
  emotional data stay private by default;
- every public pet has unpublish, delete, report, block, and visibility controls;
- open access still requires moderation, rate limits, abuse reporting, and a
  clear content policy;
- shared pet-to-pet park interactions are a later phase after the one-user
  likeness loop has evidence.

## 9. Interaction and behaviour requirements

## 7. Interaction and behaviour requirements

The semantic layer may produce a typed intent such as:

```json
{
  "intent": "comfort",
  "source": "typed",
  "confidence": 0.82,
  "evidence": ["user explicitly said they feel overwhelmed"]
}
```

The application policy then chooses the allowed behaviour:

| User signal | Intent | Possible pet behaviour |
| --- | --- | --- |
| "come here" | `come_closer` | approach, look at owner, settle |
| "I feel overwhelmed" | `comfort` | slow approach, slow blink, rest nearby |
| "let's play" | `play` | short play loop, then cooldown |
| "I need a break" | `rest` | settle, breathe-like idle motion, no forced chat |
| unclear input | `no_match` | ask a choice or remain calmly present |

The renderer must not accept arbitrary coordinates or animation names from an
AI model. The policy returns a finite command set and the animation controller
maps that command set to motion.

## 10. Success measures

These are hypotheses and measurement definitions, not claimed results.

### Primary hypothesis

At least 60% of completed first sessions rate the pet `felt like my pet` or
`partly`, and at least 40% report that the interaction helped them pause,
start, continue, or reset.

### Behaviour metrics

- onboarding start-to-complete rate;
- time from landing to first pet response;
- typed input versus speech input usage;
- percentage of sessions reaching a support action;
- intent fallback or clarification rate;
- likeness feedback distribution;
- usefulness feedback distribution;
- correction frequency and correction categories;
- profile revision and avatar-version acceptance rate;
- gesture recognition confidence and false-trigger rate;
- private-to-public publish and unpublish rate after community ships;
- extension open-to-web-action rate after the extension ships.

Do not call these product-market-fit, clinical, or causal findings. Early data
is directional and must be paired with short user comments or interviews.

## 11. Privacy and safety requirements

- No client-side provider API key.
- Any photo upload for appearance personalization requires explicit consent,
  secure processing, a deletion path, and a clearly stated retention period.
  The first playable slice may still use a preset or local-only photo path.
- Camera and microphone are off until the user clicks an explicit control.
- Speech recognition sends no raw recording to our server by default; only the
  resulting text may be interpreted, subject to the browser's implementation.
- Do not infer or claim a user's true emotion. Prefer explicit text or a user
  selected state; any passive signal is weak and uncertain.
- Do not store names, emails, conversation transcripts, or free-form feedback
  in the public repository.
- Show a calm disclaimer that this is a companion and reflection tool, not
  healthcare or crisis support. Add an appropriate urgent-help message if a
  user expresses immediate danger.
- Provide a delete/reset path for the local pet profile and any server-side
  anonymous session data supported by the deployment.

## 12. Reference product lessons

[Furever Dock](https://www.fureverdock.com/) is a product reference, not proof
of its private implementation. Its current public page positions a real-pet
inspired desktop companion around daily moments, pet skills, simple everyday
help, optional photo-based personalization, and a free premade-pet path. It
also states that conversations may be saved for Memory and that important AI
answers can be inaccurate.

Lessons for AI Petverse:

- the pet feels present because it participates in a rhythm, not only because
  it can answer a chat message;
- a free preset path reduces the cost of first use;
- personalized generation can be separated from the first playable moment;
- memory and everyday assistance require stronger privacy and deletion controls;
- the reference does not prove that one photo creates a perfect 3D twin.

## 中文

### 产品承诺

AI Petverse 不是单纯的宠物网页或聊天机器人，而是一个以用户真实猫狗的
行为、偏好和边界为依据的数字宠物 companion，帮助用户在焦虑、分心或认知
过载时暂停、开始、继续或重置一小步。

第一版的衡量标准不是“看起来最先进”，而是：真实的人能否打开网址、完成一次
互动、判断它像不像自己的宠物，并留下能够推动下一次迭代的数据。

### P0 必须有

- 首次登录后创建可持续编辑的宠物 profile；
- 猫 / 狗 preset-first onboarding；
- 先回答一组核心问题，再用可保存、可跳过的分组问题逐步补充更多细节；
- 可纠正的真实宠物 profile；
- 一个小型可互动场景；
- `come here`、`I feel overwhelmed`、`let's play` 三类行为；
- 输入文字，浏览器支持时再加 click-to-talk；
- `像我的宠物 / 部分像 / 不像` 和 usefulness feedback；
- 匿名、最小化的行为事件；
- 在线 review URL 和可复核的版本、限制、数据摘要。

### 明确延后

精确 photo-to-3D、实时视频生成、可靠情绪识别、持续摄像头监控、陌生人社交、
UGC park、支付订阅、长期记忆和完整 productivity assistant 都不进入第一条
交付路径。

### 关于真实感

真实感不是只复制外观。第一版优先复制“它会怎样靠近、何时躲开、喜欢什么、被
安慰时如何反应”。用户提供的事实和纠正必须高于通用 AI 猜测，AI 只能提供带
不确定性的结构化意图，不能直接决定动画坐标或偷偷写入宠物记忆。

### 摄像头、手势和情绪

摄像头只在用户主动打开后工作。MediaPipe 等本地模型把 landmarks 转成版本化的
`GestureEvent`，经过平滑、置信度门槛和去抖后，才交给行为策略。情绪优先使用用户
明确说出的内容或选择的 mood；脸部、声音等被动信号只能是弱信号，不能声称知道用户
真正的情绪，也不默认保存原始音视频。

### 社区

公开宠物必须是 private profile 的单独 public projection。用户自己选择公开哪些字段，
默认不公开原始照片、私人纠正、对话和情绪数据。发布必须有取消公开、删除、举报、
屏蔽、限流和 moderation；真正的 shared pet park 放到私有单宠物体验验证之后。

## Sources

- [AI Petverse repository](https://github.com/Tooonnnnyyy/ai-petverse)
- [Furever Dock](https://www.fureverdock.com/)
- `docs/HANDOFF_BROWSER_MVP.md` in this repository

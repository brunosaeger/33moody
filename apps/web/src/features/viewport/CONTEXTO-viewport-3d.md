# features/viewport: cena 3D e câmera

- `Viewport.tsx`: sem robô mostra o `ConnectCard` sobre uma grade de fundo; conectado mostra a `Scene` + sobreposições (`ConnectionBadge`, `ModeChip` ao vivo/replay, `CameraToolbar`).
- `scene/Scene.tsx`: `Canvas` com câmera inicial `[-6.5, -8.5, 7.5]`, `up [0, 0, 1]`, fov 50; luzes; `TfTreeProvider` > `RobotPoseProvider` envolvendo `Ground`, `EnabledLayers` e `CameraRig`.
- `scene/Ground.tsx`: `Grid` do drei girado π/2 em X (para ficar no plano XY).
- `camera/cameraStore.ts`: presets `orbit` (3/4, padrão), `follow`, `top`; `revision` força reaplicar o preset; salvo em `moody.camera.v1`.
- `camera/CameraRig.tsx`: `OrbitControls` com damping e `maxPolarAngle`; `follow` fica 3.2 m atrás e 2.2 m acima, suavizado.

## TF e pose do robô (`lib/tf`, `lib/scene3d`)

- `lib/tf/`: matemática pura, sem React nem three. `transform.ts` (compose, invert, rotate, yaw, `interpolate` com nlerp) e `TfTree.ts`: **histórico de 3 s por aresta** (relógio do robô, `stampToSeconds`), `/tf_static` com uma amostra só. `lookup(alvo, origem, t?)` sem `t` usa o mais recente; com `t` interpola (busca binária), e fora do histórico usa o extremo mais próximo (o tf2 lançaria erro). Mesma semântica do `lookupTransform(…, stamp)` do tf2. `chain(frame)` lista os ancestrais; `version` muda quando aparece um frame novo.
- `lib/scene3d/tfTree.tsx`: `TfTreeProvider` mantém UMA árvore por fonte e modo, alimentada por `/tf_static` e `/tf` via `followTopic`.
- `lib/scene3d/sceneFrame.ts`: o "Fixed Frame" da cena. É o `fixedFrame` do perfil (`map`); se ele ainda não existe (AMCL sem pose inicial), usa o `fallbackFrame` (`odom`).
- `RobotPoseProvider`: pose pelo perfil, `odometry` (demo) ou `tf` (`sceneFrame → baseFrame`). Roda em `useFrame` com prioridade -1, suaviza (14/s) e salta direto acima de 1 m. `useRobotPose()` = suavizada (para desenhar o robô); `useLatestRobotPose()` = sem suavização.
- **Regra:** medição de sensor NUNCA vai presa à pose atual do robô (`FollowRobot`). Ela é fixada no mundo com a pose do instante dela (`header.stamp`). Presa ao robô, ela "balança" quando ele gira (bug corrigido em 2026-11-17: erro médio de 3,5 cm caiu para 1,4 cm). A suavização da pose é só visual e só vale para o modelo do robô.
- `FollowRobot`: grupo que acompanha a pose; tudo "preso" ao robô vai dentro dele.

## Convenções

- **Convenção ROS na cena:** z para cima, metros, frame `map` na origem.
- Num robô real, a pose no mapa é `map → odom → base_footprint` (o AMCL publica `map → odom`). O demo publica a odometria já no frame map, por isso usa `kind: 'odometry'`.

# features/viewport: cena 3D e câmera

- `Viewport.tsx`: sem robô mostra o `ConnectCard` sobre uma grade de fundo; conectado mostra a `Scene` + sobreposições (`ConnectionBadge`, `ModeChip` ao vivo/replay, `CameraToolbar`).
- `scene/Scene.tsx`: `Canvas` com câmera inicial `[-6.5, -8.5, 7.5]`, `up [0, 0, 1]`, fov 50; luzes; `RobotPoseProvider` envolvendo `Ground`, `EnabledLayers` e `CameraRig`.
- `scene/Ground.tsx`: `Grid` do drei girado π/2 em X (para ficar no plano XY).
- `camera/cameraStore.ts`: presets `orbit` (3/4, padrão), `follow`, `top`; `revision` força reaplicar o preset; salvo em `moody.camera.v1`.
- `camera/CameraRig.tsx`: `OrbitControls` com damping e `maxPolarAngle`; `follow` fica 3.2 m atrás e 2.2 m acima, suavizado.

## Pose do robô (`lib/scene3d/robotPose.tsx`)

- `RobotPoseProvider`: lê o tópico de pose do perfil em `useFrame` com prioridade -1 (antes das camadas), suaviza exponencialmente (14/s) e salta direto acima de 1 m (seek no replay).
- `FollowRobot`: grupo que acompanha a pose; tudo "preso" ao robô vai dentro dele.

## Convenções

- **Convenção ROS na cena:** z para cima, metros, frame `map` na origem.
- **Limitação a resolver no passo 1:** hoje a pose vem direto de `/odom`, e o demo publica odom já no frame map. Num robô real é preciso compor o TF `map → odom → base_footprint` (AMCL publica `map → odom`).

# apps/web: o viewer

React 19 + TypeScript estrito + Vite 8, zustand 5 (com `persist`), CSS Modules, three.js com @react-three/fiber e drei. Imports internos com `@/`.

## Estrutura de `src/`

| Pasta | Papel | Contexto próprio |
|---|---|---|
| `app/` | Composição da tela única: `App.tsx` (Header + `SidebarLayout` com o `Viewport` + `Timeline`) e `sidebarTabs.ts` (registro das abas) | — |
| `config/robotProfiles.ts` | `RobotProfile`: tópicos, origem da pose (`odometry` ou `tf` com `fixedFrame`/`baseFrame`/`fallbackFrame`), dimensões e offset do laser. Perfis: `DEMO_PROFILE` e `TB3_WAFFLE_PROFILE` (`LIVE_ROBOT_PROFILES`). Vai virar YAML em `config/robots/` | — |
| `data/` | Sessão, relógio e leitura de tópicos | [CONTEXTO-sessao-e-relogio.md](src/data/CONTEXTO-sessao-e-relogio.md) |
| `features/viewport/` | Cena 3D e câmera | [CONTEXTO-viewport-3d.md](src/features/viewport/CONTEXTO-viewport-3d.md) |
| `features/layers/` | Aba Camadas | [CONTEXTO-camadas.md](src/features/layers/CONTEXTO-camadas.md) |
| `features/timeline/` | Linha do tempo | [CONTEXTO-linha-do-tempo.md](src/features/timeline/CONTEXTO-linha-do-tempo.md) |
| `features/robot-components/` | Aba Componentes | [CONTEXTO-componentes.md](src/features/robot-components/CONTEXTO-componentes.md) |
| `features/sidebar/` | Menu lateral direito: abas + divisor (largura 260–900 px, padrão 340, viewport mínimo 480 px; salvo em `moody.sidebar.v1`). Não importa features: recebe `SidebarTab[]` | — |
| `features/header/` | Barra superior com slots `start`/`center`/`end`. Título: "33 Robotics \| Plataforma de Diagnóstico" em Helvetica (`--font-brand`); a aba do navegador usa o mesmo texto. `FullscreenButton` (encaixado pelo `App` no slot `end`) liga/desliga a tela cheia via `shared/hooks/useFullscreen` (Fullscreen API; acompanha a saída por Esc/F11 pelo `fullscreenchange`) | — |
| `features/connection/` | `ConnectCard`: perfil do robô (vale para os dois casos) + endereço `ws://` → `FoxgloveSource`; "Abrir gravação (.mcap)" → `McapSource`; ou "Usar robô demo". Endereço e perfil ficam em `moody.connection.v1`. `ConnectionBadge`: "perfil · host/arquivo" + Desconectar | — |
| `lib/ros/` | Tipos de mensagens (Twist/TwistStamped + `twistOf`, Odometry, LaserScan, OccupancyGrid, TFMessage), `quaternionToYaw`, `flattenMessage`, `schemaName` | — |
| `lib/tf/` | Árvore de TF com histórico, matemática de transformações e `trajectoryFromTf`, puras | [viewport](src/features/viewport/CONTEXTO-viewport-3d.md) |
| `lib/scene3d/` | `TfTreeProvider`, `sceneFrame`, `RobotPoseProvider`, `useRobotPose`, `FollowRobot` | [viewport](src/features/viewport/CONTEXTO-viewport-3d.md) |
| `shared/` | Genérico, sem regra de negócio: `ui/` (Button, Menu com busca opcional `searchable` (↑ ↓ Enter), MenuButton, SplitPane, EmptyState, icons), `lib/` (id, storage, timeFormat), `hooks/` (useNow, useElementWidth) | — |

## Convenções

- Feature com aba exporta um `SidebarTab` no `index.ts` e é registrada em `app/sidebarTabs.ts`.
- Estado persistido usa chaves versionadas `moody.<nome>.v1` e faz merge validado ao ler.
- Componente + `Componente.module.css` lado a lado; cores só via variáveis do tema.
- Cada feature expõe só o seu `index.ts`; nada de importar arquivo interno de outra feature.

## Rodar e verificar

- Dev: `npx vite --host 127.0.0.1 --port 5173 --strictPort` (nesta pasta).
- `npm run typecheck` e `npm run lint` na raiz do monorepo.
- Teste e2e: Chrome headless via CDP com SwiftShader (WebGL). O driver fica no scratchpad da sessão e some entre sessões; recriar quando precisar. O `goto` tem que esperar o React montar (perfil novo do Chrome demora alguns segundos no 1º load). O `<input>` de horário mostra AM/PM no headless (locale en-US), não é bug.

## Armadilhas já vistas

- `pgrep -f padrão; kill` pode matar o próprio shell quando o padrão aparece no comando: rodar o kill separado, com o padrão entre colchetes.
- Headless com 813 px de altura é o Chrome reservando a barra, não bug do app.
- Texto mono com `_` cortado: `line-height: 1.6`.

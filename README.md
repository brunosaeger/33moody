# 33moody

Plataforma web de **diagnóstico robótico** da 33Robotics, com replay técnico-visual.

O replay reconstrói o que um robô fez num momento passado a partir do estado gravado (historian), sem vídeo. A mesma tela também acompanha o robô ao vivo em 3D.

- Especificação de interface e arquitetura: [docs/01-especificacao-interface.md](docs/01-especificacao-interface.md)

## Rodando

Requisito: Node ≥ 22.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento do viewer |
| `npm run build` | Build de produção (`apps/web/dist`) |
| `npm run typecheck` | Checagem de tipos em todos os pacotes |
| `npm run lint` | oxlint em `apps/` e `packages/` |

## Estrutura

```
apps/
  web/                  viewer (React + TypeScript + Vite)
packages/
  theme/                tokens visuais: fonte única para CSS e Three.js
  data-sources/         contrato DataSource + fonte demo (TS puro, sem React)
docs/                   especificações e decisões
```

Ainda vão entrar (ver o roadmap na spec): `packages/protocol`, `packages/replay-engine`, `apps/server` e `robot/` (ROS2 Jazzy, C++).

### Dentro de `apps/web/src`

```
app/        composição: a tela única e o registro de janelas (panels.ts)
data/       sessão ativa (qual fonte de dados) e hooks React de leitura
features/   uma pasta por funcionalidade (header, viewport, sidebar, connection…)
lib/        helpers de domínio sem UI (ex.: lib/ros: formatar mensagens)
shared/     UI e utilitários genéricos, sem regra de negócio
```

## Convenções

- **Tela única.** Nada de rotas ou páginas. A tela tem header, viewport e um menu lateral direito com abas.
- **Feature com aba no menu lateral** exporta um `SidebarTab` no próprio `index.ts` e é registrada em `app/sidebarTabs.ts`. O `sidebar` não importa features.
- **Cores e fontes** vêm só de `@moody/theme`. Nada de hex solto em CSS.
- **Estilo** fica em CSS Modules ao lado do componente (`Componente.module.css`).
- **Imports** dentro do app usam `@/` (ex.: `@/features/sidebar`).
- **UI não fala com robô direto:** tudo passa por um `DataSource` (`@moody/data-sources`), lido via `src/data`.
- **Nada específico do robô no código:** tópicos, frames e componentes vêm do perfil do robô (configuração).

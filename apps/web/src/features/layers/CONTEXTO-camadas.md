# features/layers: aba Camadas (os "displays" do RViz)

## Como funciona

- `types.ts`: `LayerDefinition { id, title, description, topics(profile), defaultEnabled, Component }`. O componente recebe `{ profile }` e roda dentro do `Canvas`.
- `registry.ts`: `LAYERS = [map, robot, scan, trail, velocity, tf]`. **Camada nova = pasta `<nome>/` + uma linha aqui.**
- `layersStore.ts`: liga/desliga salvo em `moody.layers.v1`. `EnabledLayers.tsx` renderiza as ligadas; `LayersPanel.tsx` são os interruptores da aba.
- O 3D lê dados com `useTopicRef` (sem re-render), nunca com `useTopicMessage`.

## Camadas

| Camada | Detalhes |
|---|---|
| `map/` | OccupancyGrid como plano texturizado em z 0.002. Só reconstrói a textura quando `grid.data` muda. `occupancyTexture.ts`: livre = `panelRaisedHi`, ocupado `#c9d1dc`, desconhecido transparente, `NearestFilter` |
| `robot/` | `GenericAmrModel`: AMR provisório de primitivas (corpo `#5b6779`, para-choque e seta âmbar, rodas, LiDAR ciano), pelas dimensões do perfil. Vai ser trocado pelo URDF |
| `scan/` | LaserScan como pontos (buffer de 4096), no offset do laser, dentro do `FollowRobot` |
| `trail/` | Rastro âmbar. Ao vivo: janela de 3 min, passo de 2 cm. Replay: amostra `messageAt` do início da faixa até o cursor (até 800 amostras, refresh a cada 150 ms) |
| `velocity/` | Setas: comandada (`cmd_vel`, âmbar) × medida (odom, ciano), 1,5 m por m/s |
| `tf/` | Eixos de `map`, `base_link` e `laser`. Hoje **derivados da pose**; com `/tf` real vão vir da árvore. Desligada por padrão |

## Armadilhas

- **Mapa preto:** `Color` do three é linear; os bytes de uma textura sRGB precisam de `getRGB(srgb, SRGBColorSpace)`. Use também `toneMapped={false}` para a cor sair exata.
- Rótulos `Html` sobrepostos: ajustar `labelZ` por frame.
- Liberar texturas da GPU (`dispose`) ao trocar ou desmontar.

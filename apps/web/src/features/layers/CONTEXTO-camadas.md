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
| `robot/` | `GenericAmrModel`: AMR provisório de primitivas (corpo `#5b6779`, para-choque e seta âmbar, rodas, LiDAR ciano). Rodas e LiDAR proporcionais às dimensões do perfil (`wheelRadius`). Vai ser trocado pelo URDF |
| `scan/` | LaserScan como pontos (buffer de 4096) **fixados no mundo** com a pose do laser no instante da medição: TF `cena ← header.frame_id` no `header.stamp`. Sem TF (demo), pose mais recente + `laserOffset`. Só muda quando chega um scan novo (como o RViz com decay 0) |
| `trail/` | Rastro âmbar. Ao vivo: **amostra a pose da cena** (TF ou odometria) a cada 150 ms, janela de 3 min, passo de 2 cm, e **recomeça em saltos > 1 m** (troca de referência ou relocalização). Replay: amostra `messageAt` da odometria do início da faixa até o cursor (até 800 amostras) |
| `velocity/` | Setas: comandada (`cmd_vel`, âmbar; aceita `Twist` ou `TwistStamped`) × medida (odom, ciano), 1,5 m por m/s |
| `tf/` | Com `/tf`: **todos os frames da árvore**, com nome só na "espinha" (`map`, `odom`, `base_footprint`) e em `base_*`/laser logo abaixo; o resto só com eixos. Sem `/tf` (demo): `map`, `base_link` e `laser` derivados da pose. Desligada por padrão |

## Armadilhas

- **Mapa preto:** `Color` do three é linear; os bytes de uma textura sRGB precisam de `getRGB(srgb, SRGBColorSpace)`. Use também `toneMapped={false}` para a cor sair exata.
- Rótulos `Html` sobrepostos: ajustar `labelZ` por frame.
- Liberar texturas da GPU (`dispose`) ao trocar ou desmontar.

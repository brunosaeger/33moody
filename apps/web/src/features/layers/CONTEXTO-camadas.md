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
| `trail/` | Rastro âmbar. Ao vivo: **amostra a pose da cena** (TF ou odometria) a cada 150 ms, janela de 3 min, passo de 2 cm, e **recomeça em saltos > 1 m** (troca de referência ou relocalização). Replay: calcula a trajetória da faixa INTEIRA uma vez e mostra até o cursor. Com perfil TF e gravação: `trajectoryFromTf` (`lib/tf`) percorre o `/tf` e amostra `cena ← baseFrame` (no `map`, como na tela). No demo: odometria via `messageAt` |
| `velocity/` | Setas: comandada (`cmd_vel`, âmbar; aceita `Twist` ou `TwistStamped`) × medida (odom, ciano), 1,5 m por m/s |
| `tf/` | Com `/tf`: **todos os frames da árvore**, com nome só na "espinha" (`map`, `odom`, `base_footprint`) e em `base_*`/laser logo abaixo; o resto só com eixos. Sem `/tf` (demo): `map`, `base_link` e `laser` derivados da pose. Desligada por padrão |

## Regra do replay: a tela é função do INSTANTE, não do caminho

Tudo o que uma camada mostra no replay tem que depender só do cursor atual (e da fonte), nunca de por onde o cursor passou antes. Assim, avançar rápido segurando a seta até t e pular direto para t desenham **exatamente** igual. Validado em 2026-11-17: valores dos componentes iguais ao `rosbag2_py` e **0 pixels diferentes** no 3D, em três paradas, inclusive a 8×.
- Cache só por identidade de dado (ex.: o `MapLayer` reconstrói a textura quando o `grid.data` muda; o `ScanLayer` refaz os pontos quando chega outro scan).
- Nada derivado da árvore de TF fica "congelado": o `ScanLayer` recalcula a pose do laser **todo quadro**. Antes ela só era calculada na chegada do scan e podia ficar com a árvore de um instante anterior.
- A única memória permitida é **visual e passageira**: a suavização da pose do robô, que converge em ~0,3 s.
- Mensagens decodificadas são compartilhadas pelo cache da fonte: **nunca modificar** um objeto de mensagem.

## Armadilhas

- **Mapa preto:** `Color` do three é linear; os bytes de uma textura sRGB precisam de `getRGB(srgb, SRGBColorSpace)`. Use também `toneMapped={false}` para a cor sair exata.
- Rótulos `Html` sobrepostos: ajustar `labelZ` por frame.
- Liberar texturas da GPU (`dispose`) ao trocar ou desmontar.

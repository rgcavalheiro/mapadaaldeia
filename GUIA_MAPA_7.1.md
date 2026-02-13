# Como obter o mapa Tibia 7.1

O mapa 7.1 **nÃ£o existe em PNG pronto** na internet. Ã‰ preciso obtÃª-lo e exportar vocÃª mesmo. Segue o passo a passo.

---

## OpÃ§Ã£o 1: OTLand + Remere's Map Editor (recomendado)

### Passo 1: Baixar o mapa 7.1

1. Crie uma conta gratuita em **https://otland.net** (se ainda nÃ£o tiver).
2. Acesse o tÃ³pico:  
   **https://otland.net/threads/7-1-real-tibia-map-as-close-as-possible.270484/**
3. Baixe o anexo **tibia71_UI.rar** (ou Tibia71_UI.rar) do primeiro post.
4. Extraia o `.rar` â€” dentro deve haver um arquivo **map.otbm** (ou em uma pasta como `world/`).

### Passo 2: Baixar o Remere's Map Editor

1. Acesse: **https://github.com/opentibiabr/remeres-map-editor/releases**
2. Baixe a versÃ£o mais recente (ex.: `rme-windows-xxx.zip`).
3. Extraia e execute o RME.

### Passo 3: Arquivos do cliente Tibia 7.1

Para o RME renderizar o mapa, ele precisa dos arquivos do cliente 7.1:

- **Tibia.spr** e **Tibia.dat** (sprites e itens)
- **items.otb** (opcional, vem muitas vezes junto com o mapa)

O pacote **tibia71_UI.rar** do OTLand pode jÃ¡ incluir parte disso. Se nÃ£o tiver:

- Procure por â€œTibia 7.1 clientâ€� ou â€œTibia 7.1 .spr .datâ€� em fÃ³runs e repositÃ³rios de OT.
- HÃ¡ um Google Drive com material de Tibia 7.0â€“7.13 citado no OTLand (link pode ter mudado).

### Passo 4: Abrir o mapa no RME

1. Abra o Remere's Map Editor.
2. Configure o **Client Version** para **7.1** (ou 7.0/7.2, se 7.1 nÃ£o aparecer).
3. Aponte os caminhos para **Tibia.spr**, **Tibia.dat** e **items.otb** (se tiver).
4. Abra o arquivo **map.otbm** que vocÃª extraiu.

### Passo 5: Exportar como PNG

1. No RME: **File** â†’ **Export as Image** (ou equivalente).
2. Na janela de exportaÃ§Ã£o, escolha exportar **por andar** (floor).
3. Salve cada andar na pasta **`exportremeres/`** com os nomes:
   - `floor-01-map.png` (andar 1)
   - `floor-02-map.png` (andar 2)
   - ...
   - `floor-07-map.png` (andar 7, principal)
   - ...
   - `floor-15-map.png` (andar 15)

   Se o RME exportar com outros nomes (ex: "Floor 7.png"), renomeie para o padrao acima.

### Passo 6: Rodar o visualizador

Reinicie o servidor (ou atualize a pÃ¡gina) para carregar os mapas 7.1.

---

## OpÃ§Ã£o 2: otclient_mapgen (mais tÃ©cnica)

Se preferir gerar tiles automaticamente:

1. Baixe o **otclient_mapgen**:  
   **https://github.com/gesior/otclient_mapgen**
2. Compile ou use o binÃ¡rio (conforme o README).
3. Coloque no projeto:
   - `map.otbm` do 7.1 (nomeie como `map.otbm`)
   - `.spr` e `.dat` do cliente 7.1
   - `items.otb`
4. Execute os comandos do README para gerar PNGs.
5. Converta/renomeie os PNGs gerados para o padrÃ£o `floor-XX-map.png` e coloque em `maps/`.

---

## Resumo dos arquivos necessÃ¡rios

| Arquivo        | Onde obter                                      |
|----------------|--------------------------------------------------|
| map.otbm       | OTLand, anexo tibia71_UI.rar                     |
| Tibia.spr      | Cliente Tibia 7.1 ou pacotes de OT 7.1          |
| Tibia.dat      | Cliente Tibia 7.1 ou pacotes de OT 7.1          |
| items.otb      | Geralmente junto com o mapa ou no pacote OT     |

---

## ObservaÃ§Ã£o

O mapa â€œ[7.1] Real Tibia Map as close as possibleâ€� Ã© uma reconstruÃ§Ã£o a partir do 7.4, com ajustes para ficar o mais prÃ³ximo do 7.1. NÃ£o Ã© o mapa exato do cliente original, mas Ã© a referÃªncia mais usada pela comunidade.

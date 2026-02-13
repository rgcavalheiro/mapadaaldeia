# Mapa Tibia 7.1

Visualizador de mapa no estilo Tibia Wiki, preparado para o **mapa Tibia 7.1**.

## Como obter o mapa 7.1

O mapa 7.1 **nÃ£o existe em PNG pronto** na internet. Ã‰ preciso baixÃ¡-lo e exportar. Siga o guia:

### Abrir o OTLand

```powershell
.\abrir-otland.ps1
```

Ou acesse manualmente:  
**https://otland.net/threads/7-1-real-tibia-map-as-close-as-possible.270484/**

### Guia completo

Leia **GUIA_MAPA_7.1.md** para o passo a passo detalhado:

1. Criar conta no OTLand (grÃ¡tis)
2. Baixar tibia71_UI.rar (contÃ©m map.otbm)
3. Baixar Remere's Map Editor
4. Obter arquivos do cliente Tibia 7.1 (.spr, .dat)
5. Abrir o mapa no RME e exportar como PNG por andar
6. Colocar os PNG em `exportremeres/` com os nomes floor-01-map.png, floor-02-map.png, etc.

## Funcionalidades

- Pan: arraste o mapa
- Zoom: scroll ou botÃµes + / âˆ’
- Coordenadas X, Y, Z no topo
- URL `#x,y,z` no estilo Tibia Wiki
- Centralizar Thais

## Estrutura

```
tibia7.1/
  index.html
  app.js
  styles.css
  exportremeres/  # PNG exportados do RME
    floor-01-map.png
    floor-07-map.png
    ...
  GUIA_MAPA_7.1.md
  abrir-otland.ps1
```

## Rodar

```bash
npx serve
```

Depois abra http://localhost:3000

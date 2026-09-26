# Map Grid Sizer (Ajuste de Grade por Nome)

[English](README.md) | [Português (Brasil)](README.pt-BR.md)

[![Foundry VTT](https://img.shields.io/badge/Foundry%20VTT-v12%20|%20v14-orange.svg)](https://foundryvtt.com/)
[![Version](https://img.shields.io/badge/version-v1.0.1-blue.svg)](module.json)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-13%20passed-brightgreen.svg)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Módulo de automação para o **Foundry Virtual Tabletop (V12 a V14)** que lê automaticamente a quantidade de quadrados contida no nome do arquivo da imagem (ex: `Entrada_de_Maglura_30x30.png`) e ajusta as dimensões da cena e o tamanho da grade em segundos, com zero desvio cumulativo de pixels.

---

## Destaques

- **Calibração Instantânea sem Desvios:** Alinha os limites da cena e o tamanho de cada célula da grade à contagem exata de linhas e colunas descrita no arquivo.
- **Motor Regex com Lookaround:** Expressão regular avançada (`(?<!\d)(\d+)\s*[xX]\s*(\d+)(?!\d)`) que não consome delimitadores adjacentes e prioriza as dimensões de grade mesmo após resoluções de tela (ex: `Mapa_1920x1080_30x30.png`).
- **Fluxos Flexíveis de Uso:** Execução automática ao criar cenas ou alterar imagens de fundo, via botão em `SceneConfig` ou pelo menu de contexto na barra de cenas.
- **Limites Seguros de Geometria:** Garante o limite mínimo de grade do Foundry (50px) e remove margens desnecessárias com padding zerado.
- **Bateria de Testes Automatizados:** 13 testes unitários validando extração de dimensões, cálculos retangulares, casos de borda e suporte a objetos de alteração aninhados e achatados.

---

## Tabelas de Domínio e Recursos

### Padrões de Nomes de Arquivos Suportados

| Padrão | Exemplo de Nome | Colunas Extraídas | Linhas Extraídas | Comportamento |
| :--- | :--- | :---: | :---: | :--- |
| `NxN` Padrão | `Entrada_Maglura_30x30.png` | 30 | 30 | Grade quadrada clássica |
| `NxM` Retangular | `Masmorra_Subterranea_40x25.webp` | 40 | 25 | Cálculo para mapas retangulares |
| Espaçado `[N x M]` | `Templo_Antigo_[20 x 30].jpg` | 20 | 30 | Suporte a colchetes e espaços intermediários |
| Delimitador Maiúsculo | `Taverna_15X12.jpeg` | 15 | 12 | Reconhecimento insensível a maiúsculas/minúsculas |
| Resolução Precedente | `Mapa_1920x1080_30x30.png` | 30 | 30 | Prioriza o candidato real de grade frente a resoluções |

### Gatilhos e Ações de Automação

| Gatilho | Local de Execução | Comportamento |
| :--- | :--- | :--- |
| **Criação de Cena** | Hook `preCreateScene` | Lê o nome da imagem original e define as dimensões corretas antes da primeira renderização. |
| **Troca de Imagem** | Hook `updateScene` | Detecta alterações no fundo (incluindo notação com ponto `background.src`) e recalibra a cena. |
| **Configuração de Cena** | Botão no `SceneConfig` | Insere o botão "Ajustar Grade pelo Nome" abaixo do campo de imagem para preenchimento imediato. |
| **Menu de Contexto** | Aba de Cenas (Barra Lateral) | Clique com botão direito em qualquer cena para recalibrar instantaneamente. |

---

## Arquitetura e Componentes

- **`parser.mjs` (`parseGridDimensions`):** Utilitário puro de extração por regex que isola pares de colunas e linhas sem engolir delimitadores circundantes.
- **`resizer.mjs` (`calculateSceneGrid`, `getSceneImageSource`):** Camada de serviço puro que calcula os pixels exatos de grade (`Math.round`), aplica limites mínimos e extrai caminhos de imagem com segurança.
- **`main.mjs`:** Gerenciador de ciclo de vida do Foundry responsável por registrar configurações de mundo, conectar hooks e injetar controles visuais no formulário de cena.

---

## Instalação

No painel de configuração do Foundry VTT, em **Instalar Módulo**, cole o link do manifesto:

```text
https://raw.githubusercontent.com/NeroHeiser/Map-Grid-Size/main/module.json
```

Ou extraia o diretório compactado na pasta de módulos do Foundry:
```text
<FoundryData>/Data/modules/map-grid-sizer
```

---

## Testes Automatizados e Qualidade

O módulo conta com testes unitários nativos executados pelo Node.js test runner:

```bash
# Executar a suíte de testes completa
npm test
```

Cobertura validada:
- Extração de dimensões em nomes com colchetes, espaços, resoluções e delimitadores.
- Cálculo de tamanho de grade e arredondamento geométrico.
- Limites de segurança (mínimo de 50px e fallback para cálculo automático).
- Extração segura de `background.src` em estruturas aninhadas e notação plana por ponto.

---

## Compatibilidade e Licença

- **Foundry VTT:** Homologado para v12 e v14.
- **Independência de Sistema:** Compatível com qualquer sistema de RPG no Foundry (dnd5e, pf2e, tormenta20, etc.).
- **Autor do Módulo:** [André Luiz (Lopes / NeroHeiser)](https://github.com/NeroHeiser).
- **Licença:** [MIT](LICENSE).

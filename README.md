# Map Grid Sizer (Ajuste de Grade por Nome de Arquivo)

**Map Grid Sizer** é um módulo para o **Foundry VTT** (compatível com v12, v13 e v14) que ajusta automaticamente as dimensões da cena e o tamanho da grade (grid) com base na quantidade de quadrados indicada no nome do arquivo da imagem.

---

## 🎯 O Problema que este módulo resolve

Ao importar mapas no Foundry VTT (sejam eles baixados de criadores de conteúdo ou feitos por você), é comum que o nome do arquivo informe a quantidade exata de quadrados do mapa (ex: `Entrada de Maglura - 30x30.png` ou `Masmorra - 40x25.webp`).

Sem o módulo, o Mestre precisa:
1. Calcular manualmente: `largura da imagem ÷ número de colunas = tamanho do grid`.
2. Abrir a configuração da cena.
3. Ajustar o Grid Size e torcer para não haver desvios cumulativos de pixels.

Com o **Map Grid Sizer**, tudo isso é feito **automaticamente em 1 segundo**!

---

## 📐 Como funciona a Matemática dos Quadrados

O módulo garante que o mapa tenha **exatamente o número de quadrados de deslocamento escrito no nome**:
1. Lê o número de colunas (`cols`) e linhas (`rows`) do nome do arquivo (ex: `30x30` → 30 quadrados de largura por 30 de altura).
2. Lê a resolução real da imagem (ex: 3000x3000px).
3. Calcula o tamanho de cada quadrado de grid em pixels inteiros (`gridSize = Math.round(resolução ÷ quadrados)`).
4. Define a largura da cena como `cols * gridSize` e a altura como `rows * gridSize`.

> **Resultado:** Cada quadrado de deslocamento coincide 100% com as linhas do mapa desenhado, com **zero desvio acumulado** e tokens se movendo exatamente na quantidade de quadrados prevista.

---

## 🏷️ Padrões de Nomes de Arquivos Suportados

O módulo detecta de forma inteligente diversos padrões de nomenclatura:

| Exemplo de Nome de Arquivo | Quadrados de Largura (Colunas) | Quadrados de Altura (Linhas) |
| :--- | :---: | :---: |
| `Entrada de Maglura - 30x30.png` | 30 | 30 |
| `Masmorra_Subterranea_40x25.webp` | 40 | 25 |
| `Templo Antigo [20 x 30].jpg` | 20 | 30 |
| `Taverna 15X12.jpeg` | 15 | 12 |
| `Caverna_50x35_noite.png` | 50 | 35 |
| `Mapa_30x30_1920x1080.png` | 30 | 30 *(filtra resoluções de tela)* |

---

## 🚀 Formas de Uso

### 1. Automático (Ao Criar ou Alterar Cena)
Ao criar uma nova cena ou selecionar uma imagem de fundo que tenha o padrão `NxN`, o módulo detecta e já configura o grid e dimensões instantaneamente.

### 2. Botão na Janela de Configuração da Cena (`SceneConfig`)
Ao abrir a edição de qualquer cena, um botão azul **"Ajustar Grade pelo Nome"** é exibido logo abaixo do campo de imagem de fundo. Clicar nele calcula os valores e preenche os campos do formulário na hora para você revisar ou salvar.

### 3. Menu de Contexto (Botão Direito na Cena)
Na barra lateral direita do Foundry (aba de Cenas), basta clicar com o botão direito sobre qualquer cena e escolher **"Redimensionar Grid pelo Nome"**.

---

## ⚙️ Configurações do Módulo

Em **Configurações de Jogo** → **Configurar Módulos** → **Map Grid Sizer**:

- **Auto-Ajustar ao Criar Cena:** Ativa/desativa o ajuste automático ao criar cenas (Padrão: *Ativado*).
- **Auto-Ajustar ao Alterar Imagem:** Ativa/desativa o ajuste automático ao trocar a imagem de fundo de uma cena (Padrão: *Ativado*).
- **Padding (Margem) da Cena:** Define a margem extra do Foundry ao redor do mapa. Padrão: `0` (área jogável termina exatamente na borda do mapa).
- **Tamanho Fixo de Grade em Pixels (Opcional):** Se for `0`, preserva a resolução da imagem. Se definir um valor (ex: `100`), forçará o grid para esse tamanho fixo.
- **Exibir Notificações:** Exibe mensagem de confirmação na tela informando os quadrados configurados.

---

## 📦 Como Instalar no seu Foundry VTT

1. Localize a pasta `Data` do seu Foundry VTT:
   - **Linux:** `~/.local/share/FoundryVTT/Data/modules/`
   - **Windows:** `%localappdata%/FoundryVTT/Data/modules/`
   - **macOS:** `~/Library/Application Support/FoundryVTT/Data/modules/`
2. Copie esta pasta (ou crie um link simbólico) para a pasta `modules`:
   ```bash
   # Exemplo de link simbólico no Linux:
   ln -s "/run/media/lopes/Hd interno/Programação/Foundry" ~/.local/share/FoundryVTT/Data/modules/map-grid-sizer
   ```
3. Abra o Foundry VTT, entre no seu Mundo, vá na aba de **Gerenciar Módulos** e ative o **Map Grid Sizer (Ajuste de Grade por Nome)**.


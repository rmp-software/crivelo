# Crivelo — Design System

> Para quem vive café.

**Idioma padrão: pt-BR. Lançamento primário: Brasil.**

Crivelo é a **casa** — o estúdio que curadoria e constrói ferramentas para quem faz café. Não é um produto que disputa atenção: é a porta de entrada que enquadra seus filhos. Crema Arena, Mesa, Coa, Léxico e Diário vivem sob a Crivelo — *"Crema Arena by Crivelo", "Mesa by Crivelo"* — cada um com o próprio acento, todos sobre a mesma fundação neutra.

Este repositório é o **sistema de marca + componentes reutilizáveis** da casa: tokens, primitivas de UI, ativos de marca, o sistema de endosso e a voz. **Sem páginas de produto, sem homepage** — essas vivem em cada produto-filho.

## O nome

`crivo` (pt-BR) = *peneira / screen*. No café especial brasileiro é vocabulário de trabalho: o tamanho de peneira que classifica o grão verde — *"café crivo 17/18"*, terminologia de Q-grader e torrefador. Linhagem: latim *cribrum* → italiano *crivello* → pt `crivo`. **Crivelo** é a estilização aportuguesada. Paroxítona: kri-**VÉ**-lo.

A peneira liga os dois lados da marca: **ofício do café** (classificar, selecionar) e **software** (filtrar, curar, portões lógicos). Uma palavra faz a ponte. A casa **apura** — guarda o que importa, deixa o resto passar.

---

## A casa é neutra — de propósito

**Crivelo não tem cor de acento própria.** Veste só os neutros crema/espresso. Isso é deliberado: cada produto-filho reivindica o próprio acento (Crema Arena = canela, etc.), então a casa precisa ficar calma para esses acentos respirarem. **Não invente um acento Crivelo.** Quando precisar de ênfase, use os neutros + hierarquia tipográfica — nunca cor.

---

## Sources

Nenhum codebase, Figma ou screenshot foi fornecido para este engajamento. O sistema é construído a partir do brief acima e da fundação herdada (tipografia, paleta neutra, raios, sombras, motion). Se/quando código de produção ou Figma aparecerem, `colors_and_type.css` e os componentes em `app/components/` são os lugares para reconciliar com a verdade.

---

## Index

- `README.md` — este arquivo (marca, voz, fundação visual, iconografia)
- `SKILL.md` — manifesto de skill para Claude/agentes
- `styles.css` — ponto de entrada único (importa fonts + tokens)
- `colors_and_type.css` — tokens de cor + tipo (base + semântico)
- `fonts.css` — carregador de webfonts (Instrument Serif, Bricolage Grotesque, Geist Mono locais; Geist Sans via Google)
- `fonts/` — arquivos de fonte
- `assets/` — wordmark e monograma (peneira / dot-matrix)
- `preview/` — cards da aba Design System (um HTML por conceito)
- `app/components/` — primitivas React reutilizáveis (Button, Card, Input, Modal, Badge, Toast, EmptyState, LoadingSpinner, SkeletonLoader, PageHeader, Sidebar, Wordmark)

---

## A família & o endosso

O lockup de endosso é **"[Produto] by Crivelo"**. O nome do produto lidera (Bricolage Grotesque 700, tinta); o endosso *"by Crivelo"* vem abaixo, menor (~40% do tamanho do produto, Geist, em `--fg-3` com "Crivelo" em `--fg`/600). O monograma da peneira é opcional, à esquerda, com altura igual ao bloco de texto.

- *"by"* sempre minúsculo — nunca *"por"*, nunca caixa alta.
- Exemplos reais: **Crema Arena by Crivelo · Mesa by Crivelo · Coa by Crivelo · Léxico by Crivelo · Diário by Crivelo.**
- Cada filho carrega o próprio acento; a casa fica neutra.

Veja `preview/brand-lockup.html` para a anatomia e a família.

---

## Content fundamentals

**Idioma.** pt-BR é primário em todo lugar — UI, microcopy, e-mails, marketing. Termos técnicos já incorporados pelo specialty BR ficam em inglês como loanwords: *free pour*, *pour*, *cup down*, *single origin*, *blend*. Vocabulário de café verde em pt: *crivo*, *peneira*, *processo* (natural / lavado / cereja descascado).

**Voz.** Crivelo fala como um estúdio que leva o ofício a sério sem se levar a sério demais: direta, calorosa, precisa. **A casa não grita — ela apura.** Calma e confiante, nunca corporativa, nunca hype.

**Pessoa.** *Você* em todo lugar. Primeira pessoa do plural *nós* só quando a casa age em nome de alguém ("A gente organiza o resto."). Nunca *tu* nem *o senhor*. Verbo no imperativo curto e ativo.

**Capitalização.** Sentence case em todo lugar — botões, títulos, navs, modais. **Sem Title Case. Sem CAIXA ALTA para ênfase** (o ALL CAPS estilo TNT é coisa da Crema Arena — não sobe pra casa). Nomes próprios de produtos mantêm a capitalização da marca ("Crema Arena", "Léxico").

**Pontuação.** Travessão em apartes — à vontade. Vírgula de Oxford não se aplica ao português. **Um ponto de exclamação por tela, no máximo** — faça por merecer. Sem ponto final em texto de botão, toast, ou stat de uma linha (taglines são frases e podem levar ponto). Use aspas curvas tipográficas.

**Números.** Números até dez por extenso no corpo ("três receitas"). Em dados, doses e cronômetros: sempre algarismos. Crivo: `17/18`. Peso: `18 g`. Tempo: `mm:ss` (`02:47`). Moeda: `R$ 30` (com espaço).

**Emoji.** Sem emoji em UI chrome, títulos ou botões. Única exceção: conteúdo gerado pelo usuário (notas, comentários).

**Exemplos.**
- ✅ "Sua coleção de café, em um lugar."
- ✅ "Comece pelo grão. A gente organiza o resto."
- ✅ "Nada por aqui ainda. Adicione o primeiro café →"
- ✅ "Salvar receita" (botão)
- ❌ "SUA COLEÇÃO DE CAFÉ NUM SÓ LUGAR!!!"
- ❌ "Organize Sua Coleção De Café Agora" (Title Case)
- ❌ "🔥 Bora cafeinar! ☕️✨"

**Taglines.**
- Principal: *"Para quem vive café."*
- Apoio: *"Sua coleção de café, em um lugar."* · *"Do grão à chave."*
- Em estudo: *"O que fica na peneira."* · *"Café merece boa ferramenta."* · *"A casa apura. Você faz."*

---

## Visual foundations

**Color.** Paleta pequena e terrosa no eixo espresso/crema. **Sem acento de marca** — a casa é só tinta sobre creme. Dois estados semânticos: `--success` (sage, verde) e `--danger` (clay, terracota), usados *só* para estado, nunca decoração. Creme é a superfície dominante; branco puro nunca é fundo. Preto puro nunca é texto — espresso `#1F1410` sempre. **Ênfase vem de tinta + tipografia, não de cor.**

**Type.** Display e wordmark são **Bricolage Grotesque** — grotesca variável contemporânea, calma mas com caráter. Momentos editoriais (pull quotes, subtítulos) usam **Instrument Serif Italic**. Corpo e UI são **Geist**. Números, cronômetros e dados são **Geist Mono** — sempre tabular.

**Spacing.** Base 4px. Alvos de toque mínimo 44px. Padding de card começa em 16px no mobile, 24px no desktop. Ritmo vertical na rampa 4/8/16/24/32/48.

**Backgrounds.** Creme sólido `--bg` é padrão. Um segundo tom `--bg-2` (latte) delineia seções — nunca gradientes. Momentos de destaque podem usar espresso `--bg-inverse` cheio com grão de papel sutil a 4%. Sem gradiente de imagem, sem blur vidro/fosco salvo sobre fotografia, sem glow.

**Photography & imagery.** Fotos são quentes, low-key, levemente granuladas — grãos verdes, peneiras, mãos sobre a balança. Nunca sobreposta a texto em hero; texto fica ao lado ou abaixo. Sem stock de estúdio, sem gente com polegar pra cima.

**Illustration & motifs.** O motivo recorrente é a **peneira / dot-matrix** — uma grade de aberturas. Pontos "guardados" sólidos, "peneirados" tênues. Aparece no monograma (que se organiza num "C"), em divisores, em cantos de cards fixados e no loader. Abstrato e refinado — nunca clipart literal.

**Borders.** 1px `--border` (marrom quente a baixa opacidade) na maioria dos divisores e inputs. Cards preferem sombra a borda; quando têm borda de ênfase é 1.5px `--border-emphasis` (tinta). Nunca cinzas neutros — bordas são sempre tingidas.

**Corner radii.** Dois níveis. Superfícies pequenas (chips, botões, inputs) usam `--radius-sm: 10px`. Cards e modais usam `--radius-md: 18px`. Folhas full-bleed usam `--radius-lg: 28px` só nos cantos de cima. Pills usam `--radius-full`. Sem cantos de 4px.

**Cards.** Superfície creme, sem borda por padrão, com sombra marrom-quente suave (`--shadow-1`). Ao pressionar não levantam — descem 1px e a sombra aperta. Cards curados/fixados ganham borda 1.5px `--border-emphasis` + uma marca de peneira no canto (tinta, nunca cor).

**Shadows.** Dois níveis. `--shadow-1` para cards em repouso. `--shadow-2` para menus flutuantes e sheets. Sem terceiro nível — se precisar subir mais, vira folha cheia.

**Transparency & blur.** Com parcimônia. Tab bar inferior: blur 16px sobre `--bg/.78`. Modais escurecem o scrim com `rgba(31,20,16,.55)`. Painéis fosco nunca dentro de cards.

**Animation.** Easing padrão `cubic-bezier(.2,.7,.2,1)` — confiante, não saltitante. Duração padrão 180ms; transições de destaque 320ms. Transições de página cross-fade com nudge de 4px em Y. Loaders são anéis concêntricos em tinta, girando em velocidades diferentes.

**Hover & press.**
- Hover (web): fundo desce um tom (`--bg → --bg-2 → --bg-3`); nunca opacidade; nunca escala.
- Press: 1px translateY pra baixo e sombra aperta. Botões ganham preenchimento 4% mais escuro.
- Focus: anel 2px **tinta** (`--focus-ring`) com offset de 2px. Sempre visível — piso de acessibilidade.

---

## Iconography

**Set.** [Lucide](https://lucide.dev/) icons, via CDN. Stroke 1.75px no mobile (24px), 1.5px no desktop (20px). Cor tinta por padrão, `currentColor` herdado.

> **Substitution note.** Nenhum set proprietário existia no handoff. Lucide foi escolhido porque o stroke 1.5–1.75px com junções arredondadas combina com o resto do sistema. Se um set custom for produzido depois, deve seguir a grade 24×24 outline-only do Lucide para troca trivial.

**Usage rules.**
- Só outline. Sem variantes filled/duotone.
- 24px no chrome mobile, 20px em listas densas, 16px dentro de botões.
- Ícones em botões: gap de 8px do label.
- **Sem cor** — ícones são tinta / `currentColor`. A casa não tem acento.

**Emoji & unicode.** Nunca como afordância de UI. Permitido só em conteúdo do usuário. Em-dash `—` e ponto médio `·` são separadores de texto.

**Logos & marks.** Wordmark e monograma vivem em `assets/` e inline em `app/components/Wordmark.tsx`. O monograma é a peneira dot-matrix 5×5: as aberturas "guardadas" se organizam num **C**. Funciona em creme e sobre espresso.

---

## Tokens at a glance

```
--brand:   #1F1410  (ink — ação primária; NÃO é cor)   --bg:    #FBF6EA  (crema)
--success: #4F8C72  (sage, só estado)                   --bg-2:  #F5ECD8
--danger:  #B83A2E  (clay, só estado)                   --fg:    #1F1410  (espresso)
--focus-ring: #1F1410 (tinta)                           --fg-3:  #7A5A4A  (muted ink)

font-display: 'Bricolage Grotesque'   font-serif: 'Instrument Serif' (italic)
font-body:    'Geist'                 font-mono:  'Geist Mono'
radii: 6 · 10 · 18 · 28 · 999
```

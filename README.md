# Último Sinal 3D

Protótipo de survival horror em primeira pessoa feito com Three.js, WebGL 2, Web Audio API e Vite.

## Requisitos

- Node.js 20.19+ ou 22.12+
- Navegador moderno com WebGL 2

## Executar

No terminal, dentro da pasta do projeto:

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

No Windows, também é possível executar `iniciar.bat`.

## Gerar versão otimizada

```bash
npm run build
npm run preview
```

A versão de produção será criada na pasta `dist`, contendo tanto a Parte 1 (`index.html`) quanto a Parte 2 (`part2.html`).

## Controles

- `WASD`: movimentação
- `Mouse`: olhar horizontal e verticalmente
- `Shift`: correr
- `F`: ligar ou desligar a lanterna
- `E`: interagir, esconder ou sair do esconderijo
- `M`: abrir ou fechar o mapa depois de encontrá-lo na recepção
- `Esc`: liberar o mouse e pausar

## Recursos implementados

- Cena 3D real em primeira pessoa
- Controle de mouse com Pointer Lock, incluindo pitch vertical
- Iluminação ambiente mais legível, sombras, tone mapping, bloom e névoa dinâmica
- Chuva, trovões, relâmpagos e áudio procedural
- Lanterna com consumo de bateria e falhas em carga baixa
- Pilhas, pistas, quadro elétrico e saída final
- Escola mais detalhada com carteiras, cadeiras, quadros, estantes, murais, bebedouros, bancos, relógios, extintores e materiais espalhados
- Armários, mesas e áreas escuras como esconderijos, com marcadores de proximidade
- Criatura com patrulha, investigação, campo de visão, audição e perseguição
- Colisão com paredes, porta magnética, carteiras, mesas, armários, estantes e demais móveis
- Medidor de perseguição com estados “à vista”, “seguindo o rastro” e “procurando”
- Objetos apoiados corretamente no piso e itens de parede alinhados às superfícies
- Ajuste automático da resolução para preservar FPS
- Geometria instanciada para reduzir draw calls
- Escada subterrânea com corredor amplo, altura contínua e proteções que acompanham a descida
- Preferência de movimento reduzido e foco de teclado visível nas interfaces

## Observação sobre Node.js

Node.js e Vite são usados para instalar dependências, executar o servidor de desenvolvimento e gerar um bundle minificado. A renderização durante o jogo ocorre no navegador, usando WebGL e a GPU.


## Atualização 2.3 — tempestade externa e portas

- A chuva agora é renderizada somente fora do perímetro coberto da escola.
- O volume ambiente da chuva foi reduzido e recebeu filtragem mais suave.
- As paredes externas possuem janelas reais, com abertura, molduras e vidro.
- O exterior inclui terreno molhado, árvores sem folhas, prédios distantes e nevoeiro.
- Relâmpagos iluminam temporariamente o exterior e os vidros.
- As portas das salas foram refeitas com pivô de dobradiça e abertura completa de 90 graus.
- As colisões das folhas abertas foram recalculadas conforme a nova posição.

## Modo debug

Na tela inicial, ative **Modo debug — Explorar e testar sem a criatura** antes de clicar em **Jogar**. Nesse modo, a criatura, a perseguição, o dano e os sons associados ao inimigo ficam desativados, mas os objetivos e interações continuam ativos.

Também é possível iniciar o jogo com o modo debug previamente marcado usando `?debug=1`, por exemplo: `http://localhost:5173/?debug=1`.

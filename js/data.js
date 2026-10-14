// Base de conhecimento do atlas.
// Correspondências chakra → glândula → órgãos seguem Barbara Brennan,
// "Mãos de Luz" (Hands of Light), fig. 7-5 e fig. 9-1.
// Ligações marcadas com source: 'complementar' não constam da tabela de Brennan
// e vêm de proximidade anatômica / tradições gerais; aparecem tracejadas.
//
// Coordenadas em metros: y para cima (pés em y=0), z para a frente,
// +x = lado ESQUERDO do corpo (a pessoa está de frente para a câmera).

export const VPC = { x: 0, z: -0.045, yTop: 2.05, yBottom: 0.5 };

export const CHAKRAS = [
  {
    id: '1', n: 1, name: 'Raiz', sanskrit: 'Muladhara', color: '#ff2a2a', vortices: 4,
    gland: 'Suprarrenais', y: 0.86, axis: 'down',
    aspects: {
      main: { code: '1', name: 'Centro coccígeo', group: 'Vontade',
        fn: 'Quantidade de energia física, vontade de viver.' },
    },
    governs: 'Coluna vertebral, rins',
    balanced: 'Bem aterrado(a), forte vontade de viver, presença no corpo.',
    deficit: 'Desaterramento, cansaço crônico, falta de vitalidade física, sensação de não querer estar aqui.',
    excess: 'Excesso de força física sem direção, impulsividade, tensão na base da coluna.',
  },
  {
    id: '2', n: 2, name: 'Sacral', sanskrit: 'Svadhisthana', color: '#ff8a1c', vortices: 6,
    gland: 'Gônadas', y: 0.95,
    aspects: {
      front: { code: '2A', name: 'Centro púbico', group: 'Sentimento',
        fn: 'Qualidade do amor pelo parceiro(a); dar e receber prazer físico, mental e espiritual.' },
      back: { code: '2B', name: 'Centro sacral', group: 'Vontade',
        fn: 'Quantidade de energia sexual.' },
    },
    governs: 'Sistema reprodutor',
    balanced: 'Prazer, sexualidade integrada, vitalidade criativa.',
    deficit: 'Baixa libido, dificuldade de receber prazer, vitalidade pélvica reduzida.',
    excess: 'Descarga sexual compulsiva, energia pélvica sem contenção.',
  },
  {
    id: '3', n: 3, name: 'Plexo Solar', sanskrit: 'Manipura', color: '#ffd21c', vortices: 10,
    gland: 'Pâncreas', y: 1.11,
    aspects: {
      front: { code: '3A', name: 'Plexo solar', group: 'Sentimento',
        fn: 'Grande prazer e expansividade, sabedoria espiritual, consciência da universalidade da vida — quem você é no Universo.' },
      back: { code: '3B', name: 'Centro diafragmático', group: 'Vontade',
        fn: 'Cura, intencionalidade em relação à própria saúde.' },
    },
    governs: 'Estômago, fígado, vesícula biliar, sistema nervoso',
    balanced: 'Sentir-se pertencente ao Universo, digestão emocional saudável.',
    deficit: 'Ansiedade, sensação de vazio, má digestão emocional e física.',
    excess: 'Controle excessivo, irritabilidade, tensão diafragmática.',
  },
  {
    id: '4', n: 4, name: 'Cardíaco', sanskrit: 'Anahata', color: '#2fe07a', vortices: 12,
    gland: 'Timo', y: 1.30,
    aspects: {
      front: { code: '4A', name: 'Centro cardíaco', group: 'Sentimento',
        fn: 'Sentimentos de amor pelos outros seres humanos, abertura para a vida.' },
      back: { code: '4B', name: 'Entre as escápulas', group: 'Vontade',
        fn: 'Vontade do ego, vontade dirigida ao mundo exterior.' },
    },
    governs: 'Coração, sangue, nervo vago, sistema circulatório',
    balanced: 'Amor que flui, abertura, vontade alinhada ao coração.',
    deficit: 'Fechamento afetivo, mágoa, isolamento.',
    excess: 'Doação sem limites (frente) ou vontade dominadora (costas).',
  },
  {
    id: '5', n: 5, name: 'Laríngeo', sanskrit: 'Vishuddha', color: '#2c8dff', vortices: 16,
    gland: 'Tireoide', y: 1.47,
    aspects: {
      front: { code: '5A', name: 'Centro da garganta', group: 'Sentimento',
        fn: 'Receber e assimilar.' },
      back: { code: '5B', name: 'Base do pescoço', group: 'Vontade',
        fn: 'Senso de si mesmo na sociedade e na profissão.' },
    },
    governs: 'Aparelho brônquico e vocal, pulmões, canal alimentar',
    balanced: 'Expressão verdadeira, capacidade de receber, lugar no mundo.',
    deficit: 'Dificuldade de se expressar ou de receber; voz contida.',
    excess: 'Falar demais, defensividade, rigidez no pescoço.',
  },
  {
    id: '6', n: 6, name: 'Frontal', sanskrit: 'Ajna', color: '#5b4dff', vortices: 96,
    gland: 'Hipófise (pituitária)', y: 1.63,
    aspects: {
      front: { code: '6A', name: 'Centro da testa', group: 'Mental',
        fn: 'Capacidade de visualizar e compreender conceitos mentais.' },
      back: { code: '6B', name: 'Executivo mental', group: 'Mental',
        fn: 'Capacidade de colocar ideias em prática.' },
    },
    governs: 'Cérebro inferior, olho esquerdo, ouvidos, nariz, sistema nervoso',
    balanced: 'Clareza, visão interior, ideias que se realizam.',
    deficit: 'Confusão, dificuldade de visualizar ou de realizar ideias.',
    excess: 'Hiperatividade mental, pensamentos que não param.',
  },
  {
    id: '7', n: 7, name: 'Coronário', sanskrit: 'Sahasrara', color: '#e9c8ff', vortices: 972,
    gland: 'Pineal', y: 1.70, axis: 'up',
    aspects: {
      main: { code: '7', name: 'Centro coronário', group: 'Mental',
        fn: 'Integração da personalidade total com a vida e com os aspectos espirituais da humanidade.' },
    },
    governs: 'Cérebro superior, olho direito',
    balanced: 'Conexão espiritual integrada à vida cotidiana.',
    deficit: 'Sensação de desconexão espiritual, falta de sentido.',
    excess: 'Fuga para o espiritual, desaterramento.',
  },
];

// Ligações órgão ↔ chakra. w = peso (1 = primário).
export const ORGANS = [
  // Cabeça
  { id: 'cerebro_sup', name: 'Cérebro superior (córtex)', system: 'Nervoso', links: [{ c: '7', w: 1 }],
    info: 'Hemisférios cerebrais. Na tabela de Brennan, governado pelo chakra coronário.' },
  { id: 'cerebro_inf', name: 'Cérebro inferior (cerebelo e tronco)', system: 'Nervoso', links: [{ c: '6', w: 1 }],
    info: 'Cerebelo e tronco encefálico, governados pelo chakra frontal.' },
  { id: 'pineal', name: 'Glândula pineal', system: 'Endócrino', gland: true, links: [{ c: '7', w: 1.2 }],
    info: 'Glândula associada ao 7º chakra. Produz melatonina e regula ritmos circadianos.' },
  { id: 'hipofise', name: 'Hipófise (pituitária)', system: 'Endócrino', gland: true, links: [{ c: '6', w: 1.2 }],
    info: 'A "glândula mestra", associada ao 6º chakra.' },
  { id: 'olho_d', name: 'Olho direito', system: 'Sentidos', side: 'R', links: [{ c: '7', w: 1 }],
    info: 'Brennan associa o olho direito ao coronário.' },
  { id: 'olho_e', name: 'Olho esquerdo', system: 'Sentidos', side: 'L', links: [{ c: '6', w: 1 }],
    info: 'Brennan associa o olho esquerdo ao frontal.' },
  { id: 'ouvidos', name: 'Ouvidos', system: 'Sentidos', links: [{ c: '6', w: 1 }], info: 'Governados pelo 6º chakra.' },
  { id: 'nariz', name: 'Nariz', system: 'Sentidos', links: [{ c: '6', w: 1 }], info: 'Governado pelo 6º chakra.' },

  // Pescoço / tórax
  { id: 'tireoide', name: 'Tireoide', system: 'Endócrino', gland: true, links: [{ c: '5', w: 1.2 }],
    info: 'Glândula do 5º chakra; regula o metabolismo.' },
  { id: 'laringe', name: 'Laringe, traqueia e brônquios', system: 'Respiratório', links: [{ c: '5', w: 1 }],
    info: '"Aparelho brônquico e vocal" na tabela de Brennan.' },
  { id: 'pulmao_e', name: 'Pulmão esquerdo', system: 'Respiratório', side: 'L',
    links: [{ c: '5', w: 1 }, { c: '4', w: 0.4, source: 'complementar' }], info: 'Pulmões: 5º chakra (Brennan); proximidade com o cardíaco.' },
  { id: 'pulmao_d', name: 'Pulmão direito', system: 'Respiratório', side: 'R',
    links: [{ c: '5', w: 1 }, { c: '4', w: 0.4, source: 'complementar' }], info: 'Pulmões: 5º chakra (Brennan); proximidade com o cardíaco.' },
  { id: 'timo', name: 'Timo', system: 'Endócrino', gland: true, links: [{ c: '4', w: 1.2 }],
    info: 'Glândula do chakra cardíaco; central na imunidade.' },
  { id: 'coracao', name: 'Coração', system: 'Circulatório', links: [{ c: '4', w: 1 }], info: 'Governado pelo chakra cardíaco.' },
  { id: 'circulacao', name: 'Sangue e sistema circulatório (aorta)', system: 'Circulatório', links: [{ c: '4', w: 1 }],
    info: 'Brennan: o cardíaco governa sangue e sistema circulatório.' },
  { id: 'vago', name: 'Nervo vago', system: 'Nervoso', links: [{ c: '4', w: 1 }],
    info: 'Do tronco encefálico até o abdômen; governado pelo cardíaco.' },

  // Abdômen
  { id: 'estomago', name: 'Estômago', system: 'Digestório', links: [{ c: '3', w: 1 }], info: 'Governado pelo plexo solar.' },
  { id: 'figado', name: 'Fígado', system: 'Digestório', links: [{ c: '3', w: 1 }], info: 'Governado pelo plexo solar.' },
  { id: 'vesicula', name: 'Vesícula biliar', system: 'Digestório', links: [{ c: '3', w: 1 }], info: 'Governada pelo plexo solar.' },
  { id: 'pancreas', name: 'Pâncreas', system: 'Endócrino', gland: true, links: [{ c: '3', w: 1.2 }],
    info: 'Glândula do 3º chakra (ilhotas de Langerhans).' },
  { id: 'baco', name: 'Baço', system: 'Linfático', links: [{ c: '3', w: 0.6, source: 'complementar' }],
    info: 'Brennan descreve um chakra menor do baço; aqui ligado ao plexo solar por proximidade.' },
  { id: 'intestinos', name: 'Intestinos (canal alimentar)', system: 'Digestório',
    links: [{ c: '5', w: 0.8 }, { c: '3', w: 0.6, source: 'complementar' }, { c: '2', w: 0.3, source: 'complementar' }],
    info: 'Brennan inclui o "canal alimentar" no 5º chakra; anatomicamente fica entre o 3º e o 2º.' },
  { id: 'rim_e', name: 'Rim esquerdo', system: 'Urinário', side: 'L', links: [{ c: '1', w: 1 }], info: 'Rins: chakra raiz (Brennan).' },
  { id: 'rim_d', name: 'Rim direito', system: 'Urinário', side: 'R', links: [{ c: '1', w: 1 }], info: 'Rins: chakra raiz (Brennan).' },
  { id: 'suprarrenais', name: 'Glândulas suprarrenais', system: 'Endócrino', gland: true, links: [{ c: '1', w: 1.2 }],
    info: 'Glândulas do chakra raiz; adrenalina e cortisol — resposta de luta ou fuga.' },
  { id: 'bexiga', name: 'Bexiga', system: 'Urinário', links: [{ c: '2', w: 0.6, source: 'complementar' }],
    info: 'Não consta da tabela de Brennan; associada ao sacral por proximidade.' },

  // Pelve
  { id: 'gonadas', name: 'Gônadas (ovários / testículos)', system: 'Endócrino', gland: true, links: [{ c: '2', w: 1.2 }],
    info: 'Glândulas do chakra sacral.' },
  { id: 'reprodutor', name: 'Sistema reprodutor (útero / próstata)', system: 'Reprodutor', links: [{ c: '2', w: 1 }],
    info: 'Governado pelo chakra sacral.' },

  // Eixo
  { id: 'coluna', name: 'Coluna vertebral', system: 'Esquelético', links: [{ c: '1', w: 1 }], info: 'Governada pelo chakra raiz.' },
  { id: 'medula', name: 'Medula espinal (sistema nervoso)', system: 'Nervoso',
    links: [{ c: '3', w: 0.7 }, { c: '6', w: 0.7 }], info: 'Brennan liga o sistema nervoso ao 3º e ao 6º chakras.' },
];

export const AURA_LAYERS = [
  { n: 1, name: 'Corpo etérico', color: '#7fb8ff', dist: '¼ a 2 polegadas',
    info: 'Teia de linhas de luz com a mesma estrutura do corpo físico — a matriz onde os tecidos se ancoram.' },
  { n: 2, name: 'Corpo emocional', color: '#ff7ad9', dist: '1 a 3 polegadas',
    info: 'Nuvens coloridas em movimento fluido, associadas aos sentimentos sobre si mesmo.' },
  { n: 3, name: 'Corpo mental', color: '#ffe066', dist: '3 a 8 polegadas',
    info: 'Luz amarela ao redor da cabeça e dos ombros; contém as formas-pensamento.' },
  { n: 4, name: 'Nível astral', color: '#ff8fb0', dist: '½ a 1 pé',
    info: 'Nuvens de cor infundidas pela luz rosa do amor; nível dos relacionamentos (eu–tu).' },
  { n: 5, name: 'Molde etérico', color: '#3a5bff', dist: '1½ a 2 pés',
    info: 'O "negativo fotográfico" — o molde perfeito do corpo etérico, em azul-cobalto.' },
  { n: 6, name: 'Corpo celestial', color: '#f2e6ff', dist: '2 a 2¾ pés',
    info: 'Luz opalescente cintilante; o nível do êxtase espiritual e do amor incondicional.' },
  { n: 7, name: 'Molde ketérico (causal)', color: '#ffd77a', dist: '2½ a 3½ pés',
    info: 'Ovo de fios de luz dourada que sustenta toda a forma da aura; o nível do "eu sei".' },
];

export const HARA = [
  { id: 'id_point', name: 'Ponto ID (individuação)', y: 2.75,
    info: 'Cerca de 1 metro acima da cabeça — o ponto em que nos individuamos a partir do divino (Brennan, "Luz Emergente").' },
  { id: 'soul_seat', name: 'Sede da alma', y: 1.37,
    info: 'Na parte superior do peito — onde residem os anseios espirituais e o propósito.' },
  { id: 'tan_tien', name: 'Tan Tien', y: 0.98,
    info: 'Esfera do tamanho de uma bola de golfe cerca de 4 cm abaixo do umbigo — o centro da vontade de encarnar.' },
];

export const CORE_STAR = { y: 1.06, info: 'A Estrela do Núcleo, ~4 cm acima do umbigo: a essência individual, a fonte de toda a energia criativa. Brennan observa que nela não existe doença.' };

// Leituras: r = diâmetro em polegadas como no pêndulo (Brennan, fig. 10-2).
// r > 0 horário (aberto), r < 0 anti-horário (fechado), 0 = parado.
// e = elipse: -1 inclinação para a esquerda (yin), +1 para a direita (yang).
const all = (r, e = 0) => Object.fromEntries(
  CHAKRAS.flatMap(c => Object.keys(c.aspects).map(a => [`${c.id}.${a}`, { r, e }])));

export const PRESETS = {
  equilibrado: { label: 'Equilibrado (todos C6)', state: all(6) },
  meditacao: { label: 'Após meditação (todos C8)', state: all(8) },
  coracao_fechado: { label: 'Coração fechado', state: { ...all(6), '4.front': { r: -5, e: 0 }, '4.back': { r: 7, e: 0.3 }, '3.front': { r: 4, e: 0 } } },
  mental: { label: 'Excesso mental, desaterrado', state: { ...all(6), '6.front': { r: 9, e: 0 }, '6.back': { r: 8, e: 0 }, '7.main': { r: 9, e: 0 }, '1.main': { r: -3, e: 0 }, '2.front': { r: 3, e: 0 }, '2.back': { r: 3, e: 0 } } },
  vontade: { label: 'Vontade excessiva (yang)', state: { ...all(6), '3.back': { r: 9, e: 0.7 }, '4.back': { r: 9, e: 0.6 }, '5.back': { r: 8, e: 0.4 }, '4.front': { r: 3, e: 0 } } },
  sem_raiz: { label: 'Raiz parada', state: { ...all(6), '1.main': { r: 0, e: 0 }, '2.back': { r: -3, e: 0 }, '7.main': { r: 8, e: 0 } } },
  expressao: { label: 'Expressão bloqueada', state: { ...all(6), '5.front': { r: -4, e: 0 }, '5.back': { r: -2, e: -0.4 } } },
  receptivo: { label: 'Excesso receptivo (yin)', state: { ...all(6, -0.6), '3.front': { r: 8, e: -0.7 }, '2.front': { r: 7, e: -0.6 } } },
};

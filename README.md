# Atlas Energético 3D

Atlas 3D interativo de **anatomia física e energética**. Mostra os órgãos, as glândulas, os 7 chakras (frente e costas), a corrente vertical de força, os nadis, as 7 camadas da aura, a linha do hara e a estrela do núcleo. As conexões seguem o modelo de Barbara Brennan (*Mãos de Luz*, *Luz Emergente*).

## O que dá para fazer

- **Desequilibrar cada chakra** (aspectos frente e costas separados), usando a notação do pêndulo de Brennan:
  `C6` aberto/equilibrado · `CC4` fechado (giro anti-horário) · `S` parado · `C10` sobreuso · elipse esquerda/direita (yin/yang).
- Ver em tempo real os **órgãos afetados**: ficam acinzentados quando desvitalizados e vermelhos pulsantes quando sobrecarregados. A lista "Impacto nos órgãos" ordena todos por gravidade.
- Ver o **fluxo de energia**: partículas espiralam para dentro dos vórtices abertos e para fora dos fechados. Os nadis pulsam do chakra até cada órgão, e a corrente vertical perde brilho quando o campo perde harmonia.
- **Aura em 7 camadas**: chakras fechados aparecem como manchas escuras na altura correspondente, e chakras em excesso como clarões.
- **Atlas**: busca e índice de todas as estruturas, com uma ficha de cada uma (função psicológica, glândula, caminho da energia, fontes).
- Cenários prontos: coração fechado, excesso mental, vontade yang, raiz parada etc.

## Rodar

Não precisa de build. Basta servir a pasta por HTTP:

```bash
python3 -m http.server 8000
```

Depois abra http://localhost:8000. Também funciona direto no GitHub Pages.

Parâmetros de URL para links diretos: `?cenario=coracao_fechado&sel=chakra:4:front`, `?aura=all&camadas=hara,core&vista=hara`, `?sel=organ:figado`.

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `js/data.js` | Base de conhecimento: chakras, órgãos, ligações, aura, hara, cenários |
| `js/state.js` | Modelo de desequilíbrio (deficiência/excesso por órgão, harmonia) |
| `js/anatomy.js` | Corpo e órgãos em 3D (procedurais) |
| `js/energy.js` | Chakras, nadis, partículas, aura, hara, estrela do núcleo |
| `js/ui.js`, `js/main.js` | Interface e cena |

## Próximos passos

- Trocar os órgãos procedurais por modelos anatômicos reais em `.glb` (ex.: [Z-Anatomy](https://www.z-anatomy.com/) / BodyParts3D, CC BY-SA), mantendo os mesmos `id`.
- Chakras menores, meridianos, modo de comparação lado a lado e salvar leituras de clientes.

---

Ferramenta educacional. Não é diagnóstico médico.

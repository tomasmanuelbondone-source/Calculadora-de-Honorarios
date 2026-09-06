// Función serverless de Vercel: consulta el JSON oficial de Justicia Córdoba
// del lado del servidor (sin bloqueo de CORS) y devuelve el jus y la UE vigentes.
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const target = 'https://www.justiciacordoba.gob.ar/Estatico/justiciaCordoba/data/CalculosJudiciales/JUS.json?v7.25';
    const r = await fetch(target);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();

    const vigentes = data.filter(d => d.IdTipoLegislacion === '2');
    const parseFechaAR = (s) => {
      const p = s.split('/');
      return new Date(p[2], p[1] - 1, p[0]);
    };
    vigentes.sort((a, b) => parseFechaAR(a.periodo) - parseFechaAR(b.periodo));
    const last = vigentes[vigentes.length - 1];
    if (!last) throw new Error('sin datos vigentes');

    const parseMoneyAR = (s) =>
      parseFloat(String(s).replace(/\$/g, '').replace(/\./g, '').replace(',', '.').trim());

    const jus = parseMoneyAR(last.JUS);
    const ue = parseMoneyAR(last.Valor);
    if (!jus || !ue) throw new Error('datos inválidos');

    res.status(200).json({ jus, ue, periodo: last.periodo });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
};

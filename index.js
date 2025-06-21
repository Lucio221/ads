import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors());

app.get("/buscar-anuncios", async (req, res) => {
  const { termo } = req.query;
  if (!termo) return res.status(400).json({ erro: "Termo de busca ausente." });

  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=MZ&q=${encodeURIComponent(termo)}&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped`;

    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(6000); // Espera o conteúdo carregar

    const anuncios = await page.evaluate(() => {
      const elementos = document.querySelectorAll('a[href*="ads/about"]');
      const resultados = [];

      elementos.forEach(el => {
        const link = el.getAttribute("href");
        const texto = el.innerText;
        if (link && texto) {
          resultados.push({
            texto,
            link: "https://facebook.com" + link,
          });
        }
      });

      return resultados.slice(0, 10); // Só os 10 primeiros
    });

    await browser.close();
    res.json({ resultados: anuncios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar anúncios." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor ativo na porta ${PORT}`));

/**
 * Widget do Copilot Clínico/Pessoal — botão flutuante + painel de chat.
 * Vanilla JS, sem dependências, no mesmo espírito offline-first/sem build
 * do Sistema ISLS. Só precisa de rede na hora de perguntar (o widget em si
 * não depende de nenhum servidor para carregar).
 *
 * Uso: solte este arquivo em qualquer página do site e inclua:
 *
 *   <script src="/caminho/para/copilot-widget.js"
 *           data-endpoint="/.netlify/functions/copilot"></script>
 *
 * `data-endpoint` é opcional — o padrão já é `/.netlify/functions/copilot`
 * (a Netlify Function deste mesmo diretório, que repassa para a API Python
 * mantendo a chave de API fora do navegador).
 */
(function () {
  "use strict";

  var scriptTag = document.currentScript;
  var ENDPOINT = (scriptTag && scriptTag.getAttribute("data-endpoint")) || "/.netlify/functions/copilot";

  var css = "\n" +
    ".cc-fab{position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;" +
    "background:#0b6e4f;color:#fff;border:none;font-size:24px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3);z-index:9998;}\n" +
    ".cc-panel{position:fixed;bottom:88px;right:20px;width:340px;max-width:92vw;max-height:70vh;" +
    "background:#fff;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.25);display:none;flex-direction:column;" +
    "font-family:system-ui,Arial,sans-serif;z-index:9999;overflow:hidden;}\n" +
    ".cc-panel.cc-open{display:flex;}\n" +
    ".cc-header{background:#0b6e4f;color:#fff;padding:10px 12px;font-weight:600;font-size:14px;}\n" +
    ".cc-body{padding:10px 12px;overflow-y:auto;flex:1;font-size:13px;line-height:1.4;white-space:pre-wrap;color:#222;}\n" +
    ".cc-footer{border-top:1px solid #eee;padding:8px;}\n" +
    ".cc-footer input, .cc-footer textarea{width:100%;box-sizing:border-box;font-size:13px;padding:6px;" +
    "border:1px solid #ccc;border-radius:6px;margin-bottom:6px;font-family:inherit;}\n" +
    ".cc-footer button{width:100%;padding:8px;background:#0b6e4f;color:#fff;border:none;border-radius:6px;" +
    "cursor:pointer;font-size:13px;}\n" +
    ".cc-footer button:disabled{opacity:.6;cursor:default;}\n" +
    ".cc-tag{display:inline-block;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;margin-bottom:6px;}\n" +
    ".cc-tag-clinico{background:#e6f4ea;color:#0b6e4f;}\n" +
    ".cc-tag-pessoal{background:#eef1ff;color:#3949ab;}\n" +
    ".cc-tag-erro{background:#fdecea;color:#b3261e;}\n";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var fab = document.createElement("button");
  fab.className = "cc-fab";
  fab.title = "Copilot";
  fab.textContent = "💬";

  var panel = document.createElement("div");
  panel.className = "cc-panel";
  panel.innerHTML =
    '<div class="cc-header">Copilot</div>' +
    '<div class="cc-body" id="cc-body">Pergunte algo clínico (protocolo, paciente) ou pessoal (tarefas, organização).</div>' +
    '<div class="cc-footer">' +
    '<input id="cc-patient" type="text" placeholder="Patient.id (opcional, só clínico)" />' +
    '<textarea id="cc-pergunta" rows="2" placeholder="O que você precisa?"></textarea>' +
    '<button id="cc-enviar">Perguntar</button>' +
    "</div>";

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  fab.addEventListener("click", function () {
    panel.classList.toggle("cc-open");
  });

  var body = panel.querySelector("#cc-body");
  var perguntaEl = panel.querySelector("#cc-pergunta");
  var patientEl = panel.querySelector("#cc-patient");
  var enviarBtn = panel.querySelector("#cc-enviar");

  function mostrar(tag, texto) {
    var tagHtml = tag ? '<span class="cc-tag cc-tag-' + tag + '">' + tag + "</span><br/>" : "";
    body.innerHTML = tagHtml + texto.replace(/</g, "&lt;");
    body.scrollTop = 0;
  }

  function enviar() {
    var pergunta = perguntaEl.value.trim();
    if (!pergunta) return;

    enviarBtn.disabled = true;
    enviarBtn.textContent = "Pensando...";
    mostrar(null, "Consultando o copilot...");

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pergunta: pergunta, patient_id: patientEl.value.trim() }),
    })
      .then(function (resp) {
        return resp.json().then(function (data) {
          if (!resp.ok) throw new Error(data.erro || data.detail || "Erro na API");
          return data;
        });
      })
      .then(function (data) {
        mostrar(data.categoria, data.resposta);
      })
      .catch(function (err) {
        mostrar("erro", "Não consegui responder agora: " + err.message);
      })
      .finally(function () {
        enviarBtn.disabled = false;
        enviarBtn.textContent = "Perguntar";
      });
  }

  enviarBtn.addEventListener("click", enviar);
  perguntaEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  });
})();

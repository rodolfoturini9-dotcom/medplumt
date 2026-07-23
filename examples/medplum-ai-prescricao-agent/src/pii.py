"""Redação de PII específica do Brasil que o `PIIMiddleware` built-in do LangChain
não cobre nativamente (CPF, telefone BR). Aplicado manualmente sobre a entrada do
usuário antes de chegar ao modelo — mesma estratégia de "redact" usada para email
no exemplo de referência (langchain1.0/src/agente.py).
"""

from __future__ import annotations

import re

_CPF_RE = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")
_TELEFONE_RE = re.compile(r"(?:\+?55\s?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}\b")


def redigir_pii_br(texto: str) -> str:
    # Um telefone sem formatação (11 dígitos) é indistinguível de um CPF sem pontuação
    # pelo regex — nesse caso o texto é redigido (o que importa para privacidade),
    # ainda que a etiqueta ("CPF" vs "TELEFONE") possa sair trocada.
    texto = _CPF_RE.sub("[CPF REDIGIDO]", texto)
    texto = _TELEFONE_RE.sub("[TELEFONE REDIGIDO]", texto)
    return texto

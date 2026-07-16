# RCP ÁGIL PRO

> **Decisões Rápidas. Mais Vidas Salvas.**

Aplicativo de suporte em tempo real para manobras de reanimação cardiopulmonar (RCP), com conformidade às diretrizes ACLS 2020, documentação simultânea e geração automática de relatório estruturado ao término do evento.

![Logo](public/logo.jpg)

## Funcionalidades

| Módulo | Descrição |
| --- | --- |
| **Gerenciamento de eventos** | Criação de evento RCP com dados do paciente, local, causa presumida e equipe |
| **Monitorização em tempo real** | Cronômetro de RCP, ritmo atual, contagem de ciclos e choques |
| **Algoritmo dinâmico ACLS** | Fluxograma adaptável conforme ritmo (FV/TV, AESP, Assistolia, Perfundível), sugestões de próximas ações e contagens regressivas |
| **Registro de ações** | Botões de um/dois toques com timestamp automático, histórico editável com auditoria |
| **Metrônomo com som alto** | Web Audio API, 100-120 bpm ajustável, indicação visual sincronizada e vibração tátil |
| **Diretrizes offline** | Consulta rápida ACLS com busca por palavra-chave (funciona sem internet) |
| **Geração de relatório** | Compilação automática em 15 seções, campos narrativos editáveis, verificação de conformidade ACLS, assinatura digital e exportação em PDF (impressão) |

## Alertas e Validações

- Verificação de ritmo a cada 2 minutos (alerta sonoro + visual quando vencida)
- Adrenalina a cada 3-5 minutos (alerta de intervalo anormal: `< 2 min` ou `> 6 min`)
- Amiodarona: aviso quando registrada antes do 3º choque
- Doses fora do intervalo recomendado exigem confirmação explícita
- Desfibrilação em ritmo não chocável exige confirmação explícita
- Critério de interrupção destacado após 30 minutos sem RCE
- Confirmação dupla para interromper a RCP (ação irreversível)
- Bloqueio de edição pós-encerramento (apenas campos narrativos), com trilha de auditoria

## Confiabilidade

- **Modo offline**: todos os dados são gravados em `localStorage`
- **Backup automático a cada ação** registrada
- **Recuperação de falha**: ao reabrir o app, o evento em andamento é retomado automaticamente

## Como executar

```bash
npm install
npm run dev
```

Abra [http://localhost:3010](http://localhost:3010).

Para gerar o build de produção:

```bash
npm run build
```

## Aviso

Esta é uma aplicação de demonstração. **Não substitui o julgamento clínico** nem sistemas certificados para uso assistencial. Autenticação hospitalar (LDAP/SSO), sincronização com prontuário eletrônico (HL7 FHIR) e integração com desfibriladores/monitores são pontos de extensão descritos na especificação, não implementados nesta demonstração.

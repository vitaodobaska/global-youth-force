/**
 * Email Service Configuration for Youth Force (Become a Partner Form)
 * 
 * GUIA DE CONFIGURAÇÃO PARA ENVIO DE E-MAILS REAIS:
 * -------------------------------------------------------------
 * 1. Crie uma conta gratuita no EmailJS (https://www.emailjs.com/) - Plano Grátis permite até 200 emails/mês.
 * 2. No menu "Email Services", adicione o serviço de e-mail conectando o endereço oficial (ex: info@globalyouthforce.org, Gmail ou Outlook).
 * 3. No menu "Email Templates", crie 2 modelos:
 *    - Template 1 (Notificação para a Equipe Youth Force):
 *        Destinatário: info@globalyouthforce.org
 *        Campos disponíveis: {{from_name}}, {{from_email}}, {{phone_number}}, {{organization}}, {{message}}
 *    - Template 2 (Confirmação Automática para a Pessoa):
 *        Destinatário: {{to_email}}
 *        Assunto: "We received your partnership interest — Youth Force"
 *        Mensagem: "Hi {{to_name}}, Thanks for reaching out! We'll be in touch with you soon!"
 * 4. Copie as chaves do seu painel e preencha abaixo, alterando ENABLED para true.
 */

export const EMAIL_CONFIG = {
  // Mude para true quando preencher as chaves abaixo
  ENABLED: false,
  SERVICE_ID: 'YOUR_EMAILJS_SERVICE_ID',
  TEMPLATE_TEAM_ID: 'YOUR_TEAM_TEMPLATE_ID',
  TEMPLATE_AUTOREPLY_ID: 'YOUR_AUTOREPLY_TEMPLATE_ID',
  PUBLIC_KEY: 'YOUR_EMAILJS_PUBLIC_KEY',
}

/**
 * Envia os e-mails da solicitação de parceria:
 * - Notificação completa para a equipe
 * - Confirmação automática com "Thanks for reaching out! We'll be in touch with you soon!" para o visitante
 */
export async function sendPartnershipEmails(payload) {
  if (!EMAIL_CONFIG.ENABLED) {
    // Simulação quando ainda não configurado (garante feedback visual perfeito sem travar)
    console.info('[EmailService] Simulação ativa. Dados que serão enviados:', {
      notificacaoEquipe: {
        to: 'info@globalyouthforce.org',
        from: `${payload.firstName} ${payload.lastName} <${payload.email}>`,
        phone: `+${payload.countryCode} ${payload.phone}`,
        org: payload.organization,
        msg: payload.message,
      },
      confirmacaoAutomatica: {
        to: payload.email,
        mensagem: "Thanks for reaching out! We'll be in touch with you soon!",
      },
    })

    // Delay suave para simular requisição
    await new Promise((resolve) => setTimeout(resolve, 800))
    return { success: true, simulated: true }
  }

  // Quando as chaves forem informadas, carrega e executa o EmailJS
  try {
    const emailjs = await import('@emailjs/browser')

    // 1. Envia para a equipe
    const teamPromise = emailjs.default.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATE_TEAM_ID,
      {
        to_name: 'Youth Force Leadership',
        to_email: 'info@globalyouthforce.org',
        from_name: `${payload.firstName} ${payload.lastName}`,
        from_email: payload.email,
        phone_number: `+${payload.countryCode} ${payload.phone}`,
        organization: payload.organization,
        message: payload.message,
      },
      EMAIL_CONFIG.PUBLIC_KEY
    )

    // 2. Envia a confirmação automática para a pessoa
    const autoReplyPromise = emailjs.default.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATE_AUTOREPLY_ID,
      {
        to_name: payload.firstName,
        to_email: payload.email,
        confirmation_message: "Thanks for reaching out! We'll be in touch with you soon!",
        organization: payload.organization,
      },
      EMAIL_CONFIG.PUBLIC_KEY
    )

    await Promise.all([teamPromise, autoReplyPromise])
    return { success: true, simulated: false }
  } catch (err) {
    console.error('[EmailService Error]:', err)
    throw err
  }
}

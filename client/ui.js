const messages={
 'pt-BR':{
  required:'Preencha este campo obrigatório.',phone:'Informe um telefone válido com DDD.',futureDate:'Escolha a data de hoje ou uma data futura.',futureTime:'Escolha um horário futuro para o agendamento.',range:'Informe uma quantidade dentro do intervalo permitido.',pattern:'Confira o formato deste campo.',passengers:'Informe de um a quatro passageiros.',imageError:'Não foi possível carregar esta fotografia.',validDate:'Informe uma data válida.',validTime:'Informe um horário válido.',maxLength:limit=>`Use até ${limit} caracteres neste campo.`,duplicate:'A mensagem já foi preparada. Aguarde alguns segundos antes de tentar novamente.',requestError:'Revise os dados para preparar a mensagem.',
  coverageFreight:city=>`Fretes e mudanças em ${city}. Consulte o atendimento para combinar seu trajeto.`,
  coverageAll:city=>`Fretes, mudanças e transporte de passageiros em ${city}. Consulte o atendimento para combinar seu trajeto.`
 },
 es:{
  required:'Complete este campo obligatorio.',phone:'Introduzca un teléfono válido con código de área.',futureDate:'Seleccione la fecha de hoy o una fecha futura.',futureTime:'Seleccione una hora futura para la reserva.',range:'Introduzca una cantidad dentro del intervalo permitido.',pattern:'Revise el formato de este campo.',passengers:'Indique entre uno y cuatro pasajeros.',imageError:'No se pudo cargar esta fotografía.',validDate:'Introduzca una fecha válida.',validTime:'Introduzca una hora válida.',maxLength:limit=>`Use hasta ${limit} caracteres en este campo.`,duplicate:'El mensaje ya está preparado. Espere unos segundos antes de volver a intentarlo.',requestError:'Revise los datos para preparar el mensaje.',
  coverageFreight:city=>`Fletes y mudanzas en ${city}. Contáctenos para organizar su recorrido.`,
  coverageAll:city=>`Fletes, mudanzas y transporte de pasajeros en ${city}. Contáctenos para organizar su recorrido.`
 }
};
export const uiText=lang=>messages[lang==='es'?'es':'pt-BR'];

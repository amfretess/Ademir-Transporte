import {normalizeRequest} from './validation.js';
export const PHONES=Object.freeze({fretes:'5547997813000',taxi:'5547997302343'});
export function makeRequest(service,input,lang='pt-BR',options={}){
 if(!Object.hasOwn(PHONES,service))throw new Error('Invalid service');
 const data=normalizeRequest(service,input,options);
 const es=lang==='es';
 const get=key=>String(data[key]||'').trim();
 const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)?value.split('-').reverse().join('/'):value;
 const labels=es?{name:'Nombre',phone:'Teléfono',origin:'Origen',from:'Dirección/barrio de origen',to:'Dirección/barrio de destino',destination:'Destino',date:'Fecha deseada',objects:'Descripción de la carga',helper:'Necesita ayudante',notes:'Observaciones',departure:'Punto de partida',time:'Hora',people:'Pasajeros',bags:'Maletas'}:{name:'Nome',phone:'Telefone',origin:'Origem',from:'Endereço/bairro de origem',to:'Endereço/bairro de destino',destination:'Destino',date:'Data desejada',objects:'Objetos',helper:'Precisa de ajudante',notes:'Observações',departure:'Partida',time:'Horário',people:'Passageiros',bags:'Malas'};
 const rows=[`${labels.name}: ${get('nome')}`,`${labels.phone}: ${get('telefone')}`];
 if(service==='fretes')rows.push(`${labels.origin}: ${get('origem')}`,get('enderecoOrigem')&&`${labels.from}: ${get('enderecoOrigem')}`,`${labels.destination}: ${get('destino')}`,get('enderecoDestino')&&`${labels.to}: ${get('enderecoDestino')}`,`${labels.date}: ${date(get('data'))}`,`${labels.objects}: ${get('objetos')}`,`${labels.helper}: ${es?({'Sim':'Sí','Não':'No'}[get('ajudante')]||get('ajudante')):get('ajudante')}`);
 else rows.push(`${labels.departure}: ${get('origem')}`,`${labels.destination}: ${get('destino')}`,`${es?'Fecha':'Data'}: ${date(get('data'))}`,`${labels.time}: ${get('horario')}`,`${labels.people}: ${get('passageiros')}`,`${labels.bags}: ${get('malas')}`);
 if(get('observacoes'))rows.push(`${labels.notes}: ${get('observacoes')}`);
 const greeting=service==='fretes'?(es?'¡Hola! Me gustaría solicitar un presupuesto para un servicio de transporte o mudanza.':'Olá! Gostaria de solicitar um orçamento de frete ou mudança.'):(es?'¡Hola! Me gustaría consultar una reserva de taxi o traslado.':'Olá! Gostaria de consultar um agendamento de táxi ou transfer.');
 const ending=service==='fretes'?(es?'Quedo a la espera de la disponibilidad y el presupuesto.':'Aguardo a disponibilidade e o orçamento pelo atendimento.'):(es?'Entiendo que la reserva está sujeta a la confirmación del servicio.':'Estou ciente de que o agendamento depende da confirmação do atendimento.');
 const message=`${greeting}\n\n${rows.filter(Boolean).join('\n')}\n\n${ending}`;
 return {message,phone:PHONES[service],url:`https://wa.me/${PHONES[service]}?text=${encodeURIComponent(message)}`};
}

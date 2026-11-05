export default function EmptyState({ icone = 'bi-inbox', titulo, descricao, acao }) {
  return (
    <div className="text-center py-5" role="status">
      <i
        className={`bi ${icone} text-secondary`}
        style={{ fontSize: '3rem' }}
        aria-hidden="true"
      ></i>
      <h2 className="h5 mt-3 mb-1">{titulo}</h2>
      {descricao && <p className="text-secondary mb-3">{descricao}</p>}
      {acao}
    </div>
  );
}
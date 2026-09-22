import FeedbackMessage from '../../components/FeedbackMessage';
import { ModuleIcon } from '../../components/ModuleSidebar';
import ProfileAvatar from '../../components/ProfileAvatar';
import { clientElevators, clientEstablishment, clientUser } from '../../data/clientData';

export default function ClientProfile() {
  return (
    <>
      <header className="page-header mb-4">
        <div>
          <p className="page-header__subtitle">Conta do estabelecimento</p>
          <h1 className="page-header__title">Perfil</h1>
        </div>
      </header>
      <article className="app-card client-profile-card p-4 p-md-5">
        <div className="d-flex flex-wrap align-items-center gap-4 pb-4 border-bottom">
          <ProfileAvatar name={clientUser.name} src={clientUser.avatar} category="clients" size="lg" decorative />
          <div>
            <h2 className="fs-4 mb-1">{clientUser.name}</h2>
            <p className="text-secondary mb-0">{clientUser.role}</p>
          </div>
        </div>
        <div className="client-profile-grid mt-4">
          <div><span><ModuleIcon name="building" /></span><div><small>Estabelecimento</small><strong>{clientEstablishment.name}</strong></div></div>
          <div><span><ModuleIcon name="building" /></span><div><small>Tipo do local</small><strong>{clientEstablishment.type}</strong></div></div>
          <div><span><ModuleIcon name="location" /></span><div><small>Endereço</small><strong>{clientEstablishment.address}</strong></div></div>
          <div><span><ModuleIcon name="elevator" /></span><div><small>Equipamentos</small><strong>{clientElevators.length} elevadores cadastrados</strong></div></div>
        </div>
        <div className="mt-4">
          <FeedbackMessage title="Dados do local aplicados automaticamente">
            O tipo <strong>Hospital</strong> é ponderado com maior peso no algoritmo HOP Priority. Você não precisa redigitar esse contexto a cada solicitação.
          </FeedbackMessage>
        </div>
      </article>
    </>
  );
}

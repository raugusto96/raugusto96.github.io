import zenithMark from './assets/zenith-mark.svg'
import { useRef, useState } from 'react'
import { TbChevronLeft, TbChevronRight, TbLayersIntersect } from 'react-icons/tb'
import { t } from './i18n'

const projects = [
  {
    id: 'zenith-finance', name: 'Zenith Finance', status: 'Desenvolvimento concluído',
    heading: 'Controle financeiro com foco na integridade dos dados.',
    description: 'Aplicação de controle financeiro com gestão de contas, importação de extratos bancários e categorização de receitas e despesas. Inclui revisão antes da importação e prevenção de lançamentos duplicados.',
    technologies: ['React', 'TypeScript', 'NestJS', 'Prisma', 'PostgreSQL'], cover: '', icon: TbLayersIntersect,
    note: 'Frontend em React e TypeScript, API em NestJS e persistência com Prisma e PostgreSQL.',
  },

]

export default function Projects() {
  const [index, setIndex] = useState(0)
  const touchStart = useRef<number | null>(null)
  const hasMultipleProjects = projects.length > 1
  const project = projects[index]
  const Icon = project.icon
  function move(direction: number) { setIndex(previous => (previous + direction + projects.length) % projects.length) }

  return <section className="projects-page" aria-label={t('Projetos')}>
    <div className="eyebrow">{t('// IDEIAS QUE GANHAM FORMA')}</div>
    <h2>{t('Uma seleção do que construo')}<span className="green">.</span></h2>
    <p className="section-copy">{t('Projetos em evolução, espaço para novos desafios e as decisões por trás de cada solução.')}</p>
    <div className="project-carousel" role="region" aria-roledescription={hasMultipleProjects ? t('carrossel') : undefined} aria-label={t('Projetos em destaque')} tabIndex={hasMultipleProjects ? 0 : undefined}
      onKeyDown={event => { if (hasMultipleProjects && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) } }}>
      <div className="project-slide" key={project.id} aria-live="polite" aria-atomic="true"
        onPointerDown={event => { if (hasMultipleProjects && event.pointerType === 'touch') touchStart.current = event.clientX }}
        onPointerCancel={() => { touchStart.current = null }}
        onPointerUp={event => { if (event.pointerType !== 'touch' || touchStart.current === null) return; const distance = event.clientX - touchStart.current; touchStart.current = null; if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1) }}>
        <div className="project-details">
          <div className="project-meta">{hasMultipleProjects && <span className="project-number">{String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>}<span className={index === 0 ? 'project-status developing' : 'project-status'}><span aria-hidden="true" />{t(project.status)}</span></div>
          <h3 className="project-name">{t(project.name)}</h3>
          <h4>{t(project.heading)}</h4>
          <p>{t(project.description)}</p>{project.technologies.length > 0 && <div className="project-technologies">{project.technologies.map(technology => <span className="tag" key={technology}>{technology}</span>)}</div>}
          {project.id === 'zenith-finance' && <details className="project-extra">
            <summary>{t('Ver detalhes do projeto')}</summary>
            <ul>
              <li>{t('Gerencie contas e organize receitas e despesas por categoria.')}</li>
              <li>{t('Importe extratos bancários e revise os lançamentos antes de confirmar.')}</li>
              <li>{t('A prevenção de duplicidades ajuda a evitar lançamentos repetidos ao importar novamente.')}</li>
            </ul>
          </details>}
          <div className="project-note"><Icon aria-hidden="true" /><span>{t(project.note)}</span></div>
        </div>
        <div className={index === 0 ? 'project-cover zenith-cover' : 'project-cover reserved-cover'} aria-hidden={index !== 0}>
          <span className="project-cover-caption">{index === 0 ? 'ZENITH / FINANCE' : t('ESPAÇO RESERVADO')}</span>
          {index === 0
            ? <div className="project-cover-orbit"><img className="zenith-mark" src={zenithMark} alt="Zenith Finance" width={64} height={64} /></div>
            : <div className="project-cover-orbit"><span className="project-cover-monogram">{project.cover}</span></div>}
          <span className="project-cover-bottom">{index === 0 ? t('CÓDIGO FECHADO') : t('O PRÓXIMO DESAFIO')}</span>
        </div>
      </div>
      {hasMultipleProjects && <div className="project-controls">
        <div className="project-pagination" aria-label={t('Escolher projeto')}>{projects.map((item, itemIndex) => <button key={item.id} className={itemIndex === index ? 'active' : ''} aria-current={itemIndex === index ? 'true' : undefined} aria-label={t('Mostrar projeto {0}: {1}', [itemIndex + 1, t(item.name)])} onClick={() => setIndex(itemIndex)}><span>{String(itemIndex + 1).padStart(2, '0')}</span><span>{t(item.name)}</span></button>)}</div>
        <div className="project-arrows"><button aria-label={t('Projeto anterior')} title={t('Projeto anterior')} onClick={() => move(-1)}><TbChevronLeft aria-hidden="true" /></button><button aria-label={t('Próximo projeto')} title={t('Próximo projeto')} onClick={() => move(1)}><TbChevronRight aria-hidden="true" /></button></div>
      </div>}
    </div>
  </section>
}

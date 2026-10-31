import { useRef, useState } from 'react'
import { TbChevronLeft, TbChevronRight, TbCode, TbLayersIntersect, TbRocket } from 'react-icons/tb'
import { t } from './i18n'

const projects = [
  {
    id: 'zenith-finance', name: 'Zenith Finance', status: 'Em desenvolvimento',
    heading: 'Controle financeiro com foco na integridade dos dados.',
    description: 'Aplicação de controle financeiro com gestão de contas, importação de extratos bancários e categorização de receitas e despesas. Inclui revisão antes da importação e prevenção de lançamentos duplicados.',
    technologies: ['React', 'TypeScript', 'NestJS', 'Prisma', 'PostgreSQL'], cover: 'ZF', icon: TbLayersIntersect,
    note: 'Frontend em React e TypeScript, API em NestJS e persistência com Prisma e PostgreSQL. Projeto em desenvolvimento.',
  },
  {
    id: 'next-project', name: 'Próximo projeto', status: 'A definir',
    heading: 'Outro desafio. Novas soluções.',
    description: 'Um espaço reservado para um projeto que mostre outras habilidades, com um problema real, decisões de implementação e resultados.',
    technologies: [], cover: '02', icon: TbCode,
    note: 'O projeto ainda não foi escolhido. Este é um espaço reservado.',
  },
  {
    id: 'future-project', name: 'Mais por vir', status: 'A definir',
    heading: 'Ideias que ainda vão ganhar forma.',
    description: 'O terceiro projeto também será definido. A proposta é complementar os outros trabalhos e mostrar diferentes partes da minha experiência.',
    technologies: [], cover: '03', icon: TbRocket,
    note: 'O projeto ainda não foi escolhido. Este é um espaço reservado.',
  },
]

export default function Projects() {
  const [index, setIndex] = useState(0)
  const touchStart = useRef<number | null>(null)
  const project = projects[index]
  const Icon = project.icon
  function move(direction: number) { setIndex(previous => (previous + direction + projects.length) % projects.length) }

  return <section className="projects-page" aria-label={t('Projetos')}>
    <div className="eyebrow">{t('// IDEIAS QUE GANHAM FORMA')}</div>
    <h2>{t('Uma seleção do que construo')}<span className="green">.</span></h2>
    <p className="section-copy">{t('Projetos em evolução, espaço para novos desafios e as decisões por trás de cada solução.')}</p>
    <div className="project-carousel" role="region" aria-roledescription={t('carrossel')} aria-label={t('Projetos em destaque')} tabIndex={0}
      onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) } }}>
      <div className="project-slide" key={project.id} aria-live="polite" aria-atomic="true"
        onPointerDown={event => { if (event.pointerType === 'touch') touchStart.current = event.clientX }}
        onPointerCancel={() => { touchStart.current = null }}
        onPointerUp={event => { if (event.pointerType !== 'touch' || touchStart.current === null) return; const distance = event.clientX - touchStart.current; touchStart.current = null; if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1) }}>
        <div className="project-details">
          <div className="project-meta"><span className="project-number">{String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span><span className={index === 0 ? 'project-status developing' : 'project-status'}><span aria-hidden="true" />{t(project.status)}</span></div>
          <h3 className="project-name">{t(project.name)}</h3>
          <h4>{t(project.heading)}</h4>
          <p>{t(project.description)}</p>{project.technologies.length > 0 && <div className="project-technologies">{project.technologies.map(technology => <span className="tag" key={technology}>{technology}</span>)}</div>}
          <div className="project-note"><Icon aria-hidden="true" /><span>{t(project.note)}</span></div>
        </div>
        <div className={index === 0 ? 'project-cover zenith-cover' : 'project-cover reserved-cover'} aria-hidden="true">
          <span className="project-cover-caption">{index === 0 ? 'ZENITH / FINANCE' : t('ESPAÇO RESERVADO')}</span>
          <div className="project-cover-orbit"><span className="project-cover-monogram">{project.cover}</span></div>
          <span className="project-cover-bottom">{index === 0 ? t('EM DESENVOLVIMENTO') : t('O PRÓXIMO DESAFIO')}</span>
        </div>
      </div>
      <div className="project-controls">
        <div className="project-pagination" aria-label={t('Escolher projeto')}>{projects.map((item, itemIndex) => <button key={item.id} className={itemIndex === index ? 'active' : ''} aria-current={itemIndex === index ? 'true' : undefined} aria-label={t('Mostrar projeto {0}: {1}', [itemIndex + 1, t(item.name)])} onClick={() => setIndex(itemIndex)}><span>{String(itemIndex + 1).padStart(2, '0')}</span><span>{t(item.name)}</span></button>)}</div>
        <div className="project-arrows"><button aria-label={t('Projeto anterior')} title={t('Projeto anterior')} onClick={() => move(-1)}><TbChevronLeft aria-hidden="true" /></button><button aria-label={t('Próximo projeto')} title={t('Próximo projeto')} onClick={() => move(1)}><TbChevronRight aria-hidden="true" /></button></div>
      </div>
    </div>
  </section>
}

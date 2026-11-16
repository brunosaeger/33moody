import { useSession, useTopics } from '@/data';
import { shortSchemaName } from '@/lib/ros';
import { MenuButton } from '@/shared/ui/MenuButton';
import { useBoardStore } from './boardStore';

/**
 * Botão "+" da aba Componentes: lista os tópicos da fonte ativa e, ao
 * escolher um, adiciona o componente correspondente ao quadro.
 */
export function AddComponentButton() {
  const topics = useTopics();
  const connected = useSession((s) => s.source !== null);
  const addTopic = useBoardStore((s) => s.addTopic);

  return (
    <MenuButton
      label="Adicionar componente"
      icon="plus"
      title="Tópicos"
      align="right"
      emptyText={connected ? 'Nenhum tópico disponível' : 'Nenhum robô conectado'}
      getItems={() =>
        topics.map((topic) => ({
          id: topic.name,
          label: topic.name,
          hint: shortSchemaName(topic.schemaName),
          onSelect: () => addTopic(topic),
        }))
      }
    />
  );
}

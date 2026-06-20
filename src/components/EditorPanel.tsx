import { useStore } from '../store';
import IdeationModule from '../modules/IdeationModule';
import CharacterModule from '../modules/CharacterModule';
import OutlineModule from '../modules/OutlineModule';
import ScreenplayModule from '../modules/ScreenplayModule';
import DialogueModule from '../modules/DialogueModule';

const MODULE_COMPONENTS: Record<string, React.FC> = {
  ideation: IdeationModule,
  character: CharacterModule,
  outline: OutlineModule,
  screenplay: ScreenplayModule,
  dialogue: DialogueModule,
};

export default function EditorPanel() {
  const { currentModule } = useStore();
  const ModuleComponent = currentModule ? MODULE_COMPONENTS[currentModule] : null;

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {ModuleComponent ? (
        <div className="flex-1 overflow-y-auto page-enter">
          <div className="max-w-5xl mx-auto px-8 py-8">
            <ModuleComponent />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
          请选择一个创作模块
        </div>
      )}
    </main>
  );
}

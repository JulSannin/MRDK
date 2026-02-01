import SocialMedia from './SocialMedia';
import lowVisionIconSvg from '../../../../../imgs/lowVisionIcon.svg';

/** Компонент дополнительных действий в навигации */
export default function NavActions() {
    return (
        <div className="flex items-center gap-[10px] mr-[10px]">
            <button
                aria-label="Включить режим для слабовидящих"
                className="w-[34px] hover:scale-[1.1] transition-transform duration-200"
            >
                <img src={lowVisionIconSvg} alt="Иконка режима для слабовидящих" />
            </button>

            <SocialMedia
                className={'hidden md:flex items-center gap-[10px] mr-[10px]'}
            />
        </div>
    );
}

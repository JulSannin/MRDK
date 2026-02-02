import FooterSocialMedia from './FooterSocialMedia';
import FooterLinks from './FooterLinks';
import FooterContacts from './FooterContacts';

/** Основной компонент подвала сайта */
export default function Footer() {
    return (
        <footer className="min-h-[180px] app-bg-dark">
            <div className="m-auto flex flex-col mt-[20px] max-w-[280px] md:max-w-[740px] xl:max-w-[1280px]">
                <div className="flex flex-col md:flex-row justify-between">
                    <FooterLinks />
                    <FooterSocialMedia />
                    <FooterContacts />
                </div>
                <p className="text-[#D9D9D9] text-[10px] font-light mt-[10px] mb-[10px]">
                    Муниципальное бюджетное учреждение культуры "Районный дом
                    культуры" 2026 - все права защищены.
                </p>
            </div>
        </footer>
    );
}

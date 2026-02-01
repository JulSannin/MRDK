import Navbar from '../navbar/Navbar';

/** Основной компонент шапки сайта */
export default function Header() {
    return (
        <header className="sticky top-0 z-50">
            <Navbar />
        </header>
    );
}

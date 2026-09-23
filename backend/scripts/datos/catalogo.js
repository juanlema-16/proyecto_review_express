// datos de ejemplo; los trailers apuntan a una búsqueda para no depender de un video puntual
const poster = (titulo) => 'https://placehold.co/300x450/1f2937/f9fafb?text=' + encodeURIComponent(titulo);
const trailer = (titulo) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(titulo + ' trailer');
const foto = (nombre) => 'https://placehold.co/300x300/374151/f9fafb?text=' + encodeURIComponent(nombre);

export const CATEGORIAS = [
    { nombre: 'novelas', descripcion: 'Telenovelas y series dramáticas por capítulos' },
    { nombre: 'anime', descripcion: 'Animación japonesa' },
    { nombre: 'cartoons', descripcion: 'Animación occidental' }
];

export const PRODUCTORAS = [
    { nombre: 'Toei Animation', pais: 'Japón', anioFundacion: 1948 },
    { nombre: 'Studio Pierrot', pais: 'Japón', anioFundacion: 1979 },
    { nombre: 'Gracie Films', pais: 'Estados Unidos', anioFundacion: 1986 },
    { nombre: 'Nickelodeon Animation Studio', pais: 'Estados Unidos', anioFundacion: 1990 },
    { nombre: 'Cartoon Network Studios', pais: 'Estados Unidos', anioFundacion: 1994 },
    { nombre: 'RCN Televisión', pais: 'Colombia', anioFundacion: 1967 }
];

export const PROGRAMAS = [
    {
        titulo: 'Naruto',
        categoria: 'anime',
        productora: 'Studio Pierrot',
        sinopsis: 'Naruto Uzumaki, un ninja adolescente rechazado por su aldea, sueña con convertirse en Hokage.',
        capitulos: [
            { temporada: 1, numero: 1, titulo: '¡Llega Naruto Uzumaki!', duracionMinutos: 23, fechaEstreno: '2002-10-03' },
            { temporada: 1, numero: 2, titulo: '¡Mi nombre es Konohamaru!', duracionMinutos: 23, fechaEstreno: '2002-10-10' }
        ]
    },
    {
        titulo: 'Dragon Ball Z',
        categoria: 'anime',
        productora: 'Toei Animation',
        sinopsis: 'Goku y sus amigos defienden la Tierra de guerreros del espacio cada vez más poderosos.',
        capitulos: [
            { temporada: 1, numero: 1, titulo: 'El misterioso guerrero del espacio', duracionMinutos: 24, fechaEstreno: '1989-04-26' }
        ]
    },
    {
        titulo: 'One Piece',
        categoria: 'anime',
        productora: 'Toei Animation',
        sinopsis: 'Monkey D. Luffy navega con su tripulación en busca del tesoro que lo hará Rey de los Piratas.',
        capitulos: [
            { temporada: 1, numero: 1, titulo: '¡Soy Luffy! El hombre que será el Rey de los Piratas', duracionMinutos: 24, fechaEstreno: '1999-10-20' }
        ]
    },
    {
        titulo: 'Los Simpson',
        categoria: 'cartoons',
        productora: 'Gracie Films',
        sinopsis: 'La vida cotidiana de una familia de clase media en la ciudad de Springfield.',
        capitulos: [
            { temporada: 1, numero: 1, titulo: 'Sin blanca Navidad', duracionMinutos: 22, fechaEstreno: '1989-12-17' },
            { temporada: 1, numero: 2, titulo: 'Bart, el genio', duracionMinutos: 22, fechaEstreno: '1990-01-14' }
        ]
    },
    {
        titulo: 'Bob Esponja',
        categoria: 'cartoons',
        productora: 'Nickelodeon Animation Studio',
        sinopsis: 'Una esponja de mar optimista trabaja como cocinero en el Crustáceo Crujiente de Fondo de Bikini.',
        capitulos: [
            { temporada: 1, numero: 1, titulo: 'Se busca ayudante', duracionMinutos: 11, fechaEstreno: '1999-05-01' }
        ]
    },
    {
        titulo: 'Hora de aventura',
        categoria: 'cartoons',
        productora: 'Cartoon Network Studios',
        sinopsis: 'Finn y su perro mágico Jake recorren la Tierra de Ooo en busca de aventuras.',
        capitulos: [
            { temporada: 1, numero: 1, titulo: 'Pánico en la pijamada', duracionMinutos: 11, fechaEstreno: '2010-04-05' }
        ]
    },
    {
        titulo: 'Yo soy Betty, la fea',
        categoria: 'novelas',
        productora: 'RCN Televisión',
        sinopsis: 'Una economista brillante pero poco agraciada entra a trabajar en una casa de modas de Bogotá.',
        capitulos: [
            { temporada: 1, numero: 1, titulo: 'Capítulo 1', duracionMinutos: 45, fechaEstreno: '1999-10-25' }
        ]
    },
    {
        titulo: 'Café, con aroma de mujer',
        categoria: 'novelas',
        productora: 'RCN Televisión',
        sinopsis: 'Una recolectora de café se enamora del heredero de una familia cafetera.',
        capitulos: []
    }
].map((programa) => ({ ...programa, poster: poster(programa.titulo), trailer: trailer(programa.titulo) }));

export const ACTORES = [
    { nombre: 'Junko Takeuchi', nacionalidad: 'Japonesa', fechaNacimiento: '1972-04-05' },
    { nombre: 'Noriaki Sugiyama', nacionalidad: 'Japonesa', fechaNacimiento: '1976-03-19' },
    { nombre: 'Masako Nozawa', nacionalidad: 'Japonesa', fechaNacimiento: '1936-10-25' },
    { nombre: 'Ryō Horikawa', nacionalidad: 'Japonesa', fechaNacimiento: '1958-06-01' },
    { nombre: 'Mayumi Tanaka', nacionalidad: 'Japonesa', fechaNacimiento: '1955-01-15' },
    { nombre: 'Dan Castellaneta', nacionalidad: 'Estadounidense', fechaNacimiento: '1957-10-29' },
    { nombre: 'Nancy Cartwright', nacionalidad: 'Estadounidense', fechaNacimiento: '1957-10-25' },
    { nombre: 'Tom Kenny', nacionalidad: 'Estadounidense', fechaNacimiento: '1962-07-13' },
    { nombre: 'Ana María Orozco', nacionalidad: 'Colombiana', fechaNacimiento: '1973-06-10' },
    { nombre: 'Jorge Enrique Abello', nacionalidad: 'Colombiana', fechaNacimiento: '1968-11-10' },
    { nombre: 'Margarita Rosa de Francisco', nacionalidad: 'Colombiana', fechaNacimiento: '1965-12-09' }
].map((actor) => ({ ...actor, foto: foto(actor.nombre) }));

// Tom Kenny aparece en dos programas: el puente Personaje en acción
export const PERSONAJES = [
    { nombre: 'Naruto Uzumaki', programa: 'Naruto', actor: 'Junko Takeuchi' },
    { nombre: 'Sasuke Uchiha', programa: 'Naruto', actor: 'Noriaki Sugiyama' },
    { nombre: 'Son Goku', programa: 'Dragon Ball Z', actor: 'Masako Nozawa' },
    { nombre: 'Son Gohan', programa: 'Dragon Ball Z', actor: 'Masako Nozawa' },
    { nombre: 'Vegeta', programa: 'Dragon Ball Z', actor: 'Ryō Horikawa' },
    { nombre: 'Monkey D. Luffy', programa: 'One Piece', actor: 'Mayumi Tanaka' },
    { nombre: 'Homero Simpson', programa: 'Los Simpson', actor: 'Dan Castellaneta' },
    { nombre: 'Bart Simpson', programa: 'Los Simpson', actor: 'Nancy Cartwright' },
    { nombre: 'Bob Esponja', programa: 'Bob Esponja', actor: 'Tom Kenny' },
    { nombre: 'Gary', programa: 'Bob Esponja', actor: 'Tom Kenny' },
    { nombre: 'Rey Helado', programa: 'Hora de aventura', actor: 'Tom Kenny' },
    { nombre: 'Beatriz Pinzón Solano', programa: 'Yo soy Betty, la fea', actor: 'Ana María Orozco' },
    { nombre: 'Armando Mendoza', programa: 'Yo soy Betty, la fea', actor: 'Jorge Enrique Abello' },
    { nombre: 'Teresa Suárez "Gaviota"', programa: 'Café, con aroma de mujer', actor: 'Margarita Rosa de Francisco' }
];

export const USUARIO_DEMO = { nombreUsuario: 'demo', correo: 'demo@review.test', contrasena: 'Demo1234' };

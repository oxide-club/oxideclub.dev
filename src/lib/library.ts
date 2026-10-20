export interface LibraryResource {
  title: string;
  url: string;
  author?: string;
  language: 'EN' | 'PT-BR';
  availability: 'gratuito' | 'comercial';
  type: 'livro' | 'documentação' | 'curso' | 'artigo' | 'ferramenta';
  note?: string;
}

export interface LibraryCategory {
  id: string;
  title: string;
  resources: LibraryResource[];
}

// Category membership is defined by the containing group; order is editorial.
export const libraryCategories: LibraryCategory[] = [
  {
    id: 'fundamentos-de-computacao',
    title: 'Fundamentos de computação',
    resources: [
      {
        title: 'The Missing Semester of Your CS Education',
        url: 'https://missing.csail.mit.edu/',
        author: 'MIT',
        language: 'EN',
        availability: 'gratuito',
        type: 'curso',
      },
      {
        title: 'Dive into Systems',
        url: 'https://diveintosystems.org/',
        author: 'Suzanne Matthews, Tia Newhall e Kevin Webb',
        language: 'EN',
        availability: 'gratuito',
        type: 'livro',
      },
      {
        title: 'Nand to Tetris',
        url: 'https://www.nand2tetris.org/',
        author: 'Noam Nisan e Shimon Schocken',
        language: 'EN',
        availability: 'gratuito',
        type: 'curso',
      },
    ],
  },
  {
    id: 'programacao-em-c',
    title: 'Programação em C',
    resources: [
      {
        title: 'Introdução à Programação em C',
        url: 'https://www.inf.ufpr.br/hexsel/ci067/01_intro.html',
        author: 'UFPR',
        language: 'PT-BR',
        availability: 'gratuito',
        type: 'curso',
      },
      {
        title: 'Introdução ao Curso de C',
        url: 'https://www.ic.unicamp.br/~mc102/mc102-2017/introducao-ao-curso-de-c.html',
        author: 'Unicamp',
        language: 'PT-BR',
        availability: 'gratuito',
        type: 'curso',
      },
      {
        title: "Beej's Guide to C Programming",
        url: 'https://beej.us/guide/bgc/',
        language: 'EN',
        availability: 'gratuito',
        type: 'livro',
      },
      {
        title: 'Modern C',
        url: 'https://gustedt.gitlabpages.inria.fr/modern-c/',
        author: 'Jens Gustedt',
        language: 'EN',
        availability: 'gratuito',
        type: 'livro',
      },
      {
        title: 'cppreference — C',
        url: 'https://en.cppreference.com/w/c',
        language: 'EN',
        availability: 'gratuito',
        type: 'documentação',
      },
      {
        title: 'GNU C Language Manual',
        url: 'https://www.gnu.org/software/c-intro-and-ref/manual/html_node/',
        language: 'EN',
        availability: 'gratuito',
        type: 'documentação',
      },
    ],
  },
  {
    id: 'ferramentas-de-desenvolvimento-e-unix',
    title: 'Ferramentas de desenvolvimento e Unix',
    resources: [
      {
        title: 'Guia Foca GNU/Linux',
        url: 'https://guiafoca.org/',
        language: 'PT-BR',
        availability: 'gratuito',
        type: 'livro',
      },
      {
        title: 'Pro Git',
        url: 'https://git-scm.com/book/pt-br/v2',
        author: 'Scott Chacon e Ben Straub',
        language: 'PT-BR',
        availability: 'gratuito',
        type: 'livro',
      },
      {
        title: 'GNU Make Manual',
        url: 'https://www.gnu.org/software/make/manual/html_node/',
        language: 'EN',
        availability: 'gratuito',
        type: 'documentação',
      },
      {
        title: 'Debugging with GDB',
        url: 'https://sourceware.org/gdb/current/onlinedocs/gdb.html/',
        language: 'EN',
        availability: 'gratuito',
        type: 'documentação',
      },
      {
        title: 'Valgrind Quick Start Guide',
        url: 'https://valgrind.org/docs/manual/quick-start.html',
        language: 'EN',
        availability: 'gratuito',
        type: 'documentação',
      },
      {
        title: 'Compiler Explorer',
        url: 'https://godbolt.org/',
        language: 'EN',
        availability: 'gratuito',
        type: 'ferramenta',
      },
    ],
  },
  {
    id: 'arquitetura-de-computadores',
    title: 'Arquitetura de computadores',
    resources: [
      {
        title: 'Putting the "You" in CPU',
        url: 'https://cpu.land/',
        language: 'EN',
        availability: 'gratuito',
        type: 'artigo',
      },
      {
        title: 'Arquitetura de Computadores: A Visão do Software',
        url: 'https://memoria.ifrn.edu.br/handle/1044/982',
        author: 'IFRN',
        language: 'PT-BR',
        availability: 'gratuito',
        type: 'livro',
      },
      {
        title: 'Structured Computer Organization',
        url: 'https://dspace.sxcjpr.edu.in/jspui/bitstream/123456789/1057/1/Andrew%20S.%20Tanenbaum%20-%20Structured%20Computer%20Organization.pdf',
        author: 'Andrew S. Tanenbaum e Todd Austin',
        language: 'EN',
        availability: 'gratuito',
        type: 'livro',
        note: 'PDF',
      },
      {
        title: "Computer Systems: A Programmer's Perspective",
        url: 'https://www.pearson.com/en-us/subject-catalog/p/computer-systems-a-programmers-perspective/P200000003479',
        author: "Randal Bryant e David O'Hallaron",
        language: 'EN',
        availability: 'comercial',
        type: 'livro',
      },
      {
        title: 'Programação em Baixo Nível',
        url: 'https://novatec.com.br/livros/programacao-em-baixo-nivel/',
        author: 'Igor Zhirkov',
        language: 'PT-BR',
        availability: 'comercial',
        type: 'livro',
      },
      {
        title: 'Build an 8-bit Computer',
        url: 'https://eater.net/8bit',
        author: 'Ben Eater',
        language: 'EN',
        availability: 'gratuito',
        type: 'curso',
      },
    ],
  },
  {
    id: 'sistemas-operacionais-e-programacao-de-sistemas',
    title: 'Sistemas operacionais e programação de sistemas',
    resources: [
      {
        title: 'Sistemas Operacionais: Conceitos e Mecanismos',
        url: 'https://wiki.inf.ufpr.br/maziero/doku.php?id=socm:start',
        author: 'Carlos Maziero',
        language: 'PT-BR',
        availability: 'gratuito',
        type: 'livro',
      },
      {
        title: 'Operating Systems: Three Easy Pieces',
        url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
        author: 'Remzi e Andrea Arpaci-Dusseau',
        language: 'EN',
        availability: 'gratuito',
        type: 'livro',
      },
      {
        title: 'Linux man-pages',
        url: 'https://man7.org/linux/man-pages/',
        language: 'EN',
        availability: 'gratuito',
        type: 'documentação',
      },
      {
        title: 'The Linux Programming Interface',
        url: 'https://man7.org/tlpi/',
        author: 'Michael Kerrisk',
        language: 'EN',
        availability: 'comercial',
        type: 'livro',
      },
      {
        title: 'MIT — Operating System Engineering',
        url: 'https://pdos.csail.mit.edu/6.1810/2026/',
        author: 'MIT',
        language: 'EN',
        availability: 'gratuito',
        type: 'curso',
      },
    ],
  },
  {
    id: 'estruturas-de-dados-e-algoritmos',
    title: 'Estruturas de dados e algoritmos',
    resources: [
      {
        title: 'Entendendo Algoritmos — 2ª edição',
        url: 'https://novatec.com.br/livros/entendendo-algoritmos-2ed/',
        author: 'Aditya Bhargava',
        language: 'PT-BR',
        availability: 'comercial',
        type: 'livro',
      },
      {
        title: 'Projeto de Algoritmos',
        url: 'https://www.ime.usp.br/~pf/algoritmos/',
        author: 'Paulo Feofiloff',
        language: 'PT-BR',
        availability: 'gratuito',
        type: 'curso',
      },
      {
        title: 'VisuAlgo',
        url: 'https://visualgo.net/en',
        language: 'EN',
        availability: 'gratuito',
        type: 'ferramenta',
      },
      {
        title: 'Open Data Structures',
        url: 'https://opendatastructures.org/',
        author: 'Pat Morin',
        language: 'EN',
        availability: 'gratuito',
        type: 'livro',
      },
    ],
  },
  {
    id: 'redes-de-computadores',
    title: 'Redes de computadores',
    resources: [
      {
        title: "Beej's Guide to Networking Concepts",
        url: 'https://beej.us/guide/bgnet0/',
        language: 'EN',
        availability: 'gratuito',
        type: 'livro',
      },
      {
        title: "Beej's Guide to Network Programming",
        url: 'https://beej.us/guide/bgnet/',
        language: 'EN',
        availability: 'gratuito',
        type: 'livro',
      },
      {
        title: 'TCP/IP Illustrated, Volume 1: The Protocols',
        url: 'https://www.pearson.com/en-us/subject-catalog/p/tcp-ip-illustrated-volume-1-the-protocols/P200000000242/9780321336316',
        author: 'W. Richard Stevens e Kevin R. Fall',
        language: 'EN',
        availability: 'comercial',
        type: 'livro',
      },
      {
        title: "Wireshark User's Guide",
        url: 'https://www.wireshark.org/docs/wsug_html_chunked/',
        language: 'EN',
        availability: 'gratuito',
        type: 'documentação',
      },
    ],
  },
  {
    id: 'linguagens-de-programacao-e-compiladores',
    title: 'Linguagens de programação e compiladores',
    resources: [
      {
        title: 'The Rust Programming Language',
        url: 'https://doc.rust-lang.org/book/',
        language: 'EN',
        availability: 'gratuito',
        type: 'livro',
      },
      {
        title: 'A Linguagem de Programação Rust',
        url: 'https://rust-br.github.io/rust-book-pt-br/',
        language: 'PT-BR',
        availability: 'gratuito',
        type: 'livro',
        note: 'tradução histórica',
      },
      {
        title: 'Rustlings',
        url: 'https://rustlings.rust-lang.org/',
        language: 'EN',
        availability: 'gratuito',
        type: 'ferramenta',
      },
      {
        title: 'LearnCpp',
        url: 'https://www.learncpp.com/',
        language: 'EN',
        availability: 'gratuito',
        type: 'curso',
      },
      {
        title: 'A Tour of C++',
        url: 'https://www.stroustrup.com/tour3.html',
        author: 'Bjarne Stroustrup',
        language: 'EN',
        availability: 'comercial',
        type: 'livro',
      },
      {
        title: 'Crafting Interpreters',
        url: 'https://craftinginterpreters.com/',
        author: 'Robert Nystrom',
        language: 'EN',
        availability: 'gratuito',
        type: 'livro',
      },
    ],
  },
];

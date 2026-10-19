---
title: '#1: Construa seu wc'
slug: 'recriando-wc'
summary: 'Implemente um wc em C para investigar streams, EOF e gerenciamento de estado: conte linhas, palavras e bytes com uso constante de memória.'
publishedAt: 2026-10-18
draft: false
difficulty: beginner
categories: [build, investigate]
participation: flagship
recommendedLanguage: C
topics:
  [
    'Entrada e saída',
    'Loops',
    'Caracteres',
    'Streams',
    'EOF',
    'Gerenciamento de estado',
  ]
featured: true
environment: 'C11 · Exemplos para terminais Unix/Linux'
---

**Linguagem:** C (C11)  
**Dificuldade:** Iniciante  
**Conceitos:** Entrada e saída, loops, caracteres, streams, EOF e gerenciamento de estado.

## O desafio

Você já se perguntou como programas do terminal conseguem analisar o conteúdo de arquivos?

Em sistemas Unix e Linux, existe um pequeno programa chamado `wc` (_word count_), utilizado para contar linhas, palavras e bytes em uma entrada.

Por exemplo:

```bash
$ printf 'Hello, world!\n' | wc -l -w -c
1 2 14
```

Apesar de sua simplicidade, essa ferramenta introduz conceitos importantes sobre como programas processam dados.

**Sua missão é construir uma versão simplificada do `wc`, utilizando a linguagem C.**

O objetivo não é reproduzir todo o programa original, mas compreender os mecanismos necessários para construí-lo. Não existe uma única implementação correta: as decisões que você consegue explicar também fazem parte do aprendizado.

### Antes de começar

Você precisa conhecer variáveis, condicionais, loops e funções em C. Familiaridade básica com o terminal ajuda. Consulte a documentação durante a implementação: memorizar funções não é um pré-requisito.

O ambiente de referência é C11 em Unix/Linux, com bytes de 8 bits. Os exemplos usam um shell Unix-like. O escopo obrigatório considera texto ASCII, leitura e escrita bem-sucedidas e contagens que caibam no tipo inteiro escolhido. Tratamento de falhas, estouro de contadores e outras codificações ficam no aprofundamento opcional.

### Seu primeiro passo

Comece com um programa que lê a entrada padrão até o fim e conta bytes. Depois acrescente a contagem de linhas e, por último, a de palavras. Teste cada etapa antes de seguir.

Em C, guarde o retorno de `getchar()` ou `fgetc()` em uma variável do tipo `int`, não `char`. Essas funções precisam representar tanto os valores dos bytes lidos quanto o valor especial `EOF`. EOF não é um caractere que você deve contar.

Para reconhecer palavras, pense no estado da leitura: você estava dentro ou fora de uma palavra antes de ler o próximo byte?

## 1. Requisitos

No escopo mínimo, seu programa, chamado `oxide-wc`, será executado sem argumentos e deverá:

1. Ler dados da entrada padrão (_stdin_).
2. Contar a quantidade de linhas, palavras e bytes recebidos.
3. Exibir os três valores ao terminar a leitura.
4. Processar a entrada progressivamente, sem precisar armazenar todo o conteúdo na memória.

A saída deve seguir este formato:

```text
<linhas> <palavras> <bytes>
```

Escreva apenas os três inteiros decimais não negativos em `stdout`, separados por exatamente um espaço, sem espaços nas extremidades, e finalize com uma única quebra de linha (`'\n'`). Não imprima os nomes dos campos, prompts ou mensagens de progresso. Ao concluir com sucesso, retorne status 0.

### Como realizar a contagem

**Linhas:** conte cada ocorrência do caractere de nova linha (`'\n'`). Uma entrada que não termina com `'\n'` não ganha uma linha adicional.

**Palavras:** uma palavra é uma sequência contínua de um ou mais bytes que não representam espaços em branco. Considere como separadores somente espaço, tabulação (`'\t'`), nova linha (`'\n'`), retorno de carro (`'\r'`), tabulação vertical (`'\v'`) e avanço de página (`'\f'`).

**Bytes:** conte todos os bytes efetivamente lidos da entrada, inclusive os separadores. Para os testes obrigatórios, considere textos ASCII. Bytes e caracteres não são sempre a mesma coisa: em UTF-8, por exemplo, uma letra com acento pode ocupar mais de um byte.

## 2. Exemplo de execução

Após compilar seu programa, a seguinte execução:

```bash
$ printf 'Hello world\nC is fun\n' | ./oxide-wc
2 5 21
```

Deverá produzir:

- 2 linhas
- 5 palavras
- 21 bytes

Você também poderá executar o programa diretamente:

```bash
$ ./oxide-wc
Hello world
C is fun
```

Nesse caso, será necessário sinalizar o fim da entrada (_EOF_), normalmente utilizando `Ctrl+D` em uma linha vazia nos terminais Unix/Linux. Se houver texto ainda não enviado na linha, o primeiro `Ctrl+D` pode apenas disponibilizar esse texto para leitura.

Também é possível ler um arquivo sem implementar argumentos:

```bash
./oxide-wc < exemplo.txt
```

Aqui, o shell abre o arquivo e o conecta à entrada padrão. Para o seu programa, a leitura continua vindo de `stdin`.

## 3. Casos de teste

Utilize os exemplos abaixo para verificar sua implementação. Os comandos `printf` apresentados são para shells Unix-like.

| Entrada                | Saída esperada |
| ---------------------- | -------------- |
| `printf ''`            | `0 0 0`        |
| `printf 'hello'`       | `0 1 5`        |
| `printf 'hello\n'`     | `1 1 6`        |
| `printf 'a b\n'`       | `1 2 4`        |
| `printf 'a\nb'`        | `1 2 3`        |
| `printf 'one   two\n'` | `1 2 10`       |
| `printf 'a\tb\n'`      | `1 2 4`        |

**Atenção:** uma entrada vazia, múltiplos espaços consecutivos e a ausência de uma quebra de linha no final são situações que seu programa deve tratar corretamente.

Você consegue imaginar outros casos que poderiam revelar erros na contagem?

Experimente também uma entrada formada apenas pelos seis separadores, um par CRLF (`'\r\n'`) e uma palavra longa. CRLF representa dois bytes, mas apenas uma ocorrência de `'\n'`.

### Como comparar os resultados

Acrescente `| ./oxide-wc` a cada comando da tabela. Por exemplo:

```bash
printf 'one   two\n' | ./oxide-wc
# 1 2 10
```

Para conferir as contagens com a ferramenta do sistema, execute:

```bash
printf 'one   two\n' | LC_ALL=C wc -l -w -c
```

`LC_ALL=C` fixa o locale para a comparação. O `wc` original pode inserir espaços de alinhamento; compare os três números. A sua implementação deve seguir o formato exato definido neste desafio. O primeiro exemplo da página também mostra as contagens sem esse alinhamento.

Se quiser inspecionar espaços e quebras de linha da sua saída, use `od -An -tx1`. Consultar o `wc` como referência para testar é permitido; executá-lo dentro da sua implementação não é.

## 4. Restrições

- Utilize apenas C e sua biblioteca padrão.
- Não execute o `wc` original por dentro do seu programa.
- Não carregue toda a entrada na memória para processá-la posteriormente.
- Não é necessário utilizar alocação dinâmica, ponteiros explícitos ou estruturas de dados complexas.
- A saída deve respeitar o formato especificado para facilitar os testes.

Você tem liberdade para organizar seu código como preferir.

Para compilar, sugerimos:

```bash
cc -std=c11 -Wall -Wextra -Wpedantic \
   -o oxide-wc main.c
```

## 5. Desafios extras (opcionais)

Terminou a implementação principal? Experimente expandir o programa.

### Nível 2 — Argumentos de linha de comando

Permita que o usuário informe o caminho de um arquivo:

```bash
./oxide-wc exemplo.txt
```

Defina o que deve acontecer se o arquivo não existir ou não puder ser aberto. Use `stderr` para diagnósticos e um status diferente de zero para indicar falha.

### Nível 3 — Flags

Implemente as opções:

- `-l`: mostrar apenas o número de linhas.
- `-w`: mostrar apenas o número de palavras.
- `-c`: mostrar apenas o número de bytes.

Antes de implementar, escreva como combinar opções, em que ordem apresentar os valores e como tratar opções desconhecidas. Sua extensão não precisa reproduzir todas as decisões do utilitário original.

### Nível 4 — Investigação de desempenho

Compare duas implementações: uma que lê a entrada byte a byte e outra que utiliza um buffer.

Pesquise como o tamanho do buffer pode influenciar o desempenho e como medir essa diferença. Verifique se uma palavra que atravessa dois blocos continua sendo contada corretamente.

Registre a máquina, o compilador, as opções de compilação, o tamanho da entrada e o método de medição. Explique os limites do experimento antes de concluir que uma abordagem é mais rápida.

### Aprofundamento — Bytes, limites e falhas

Escolha uma investigação, se ela despertar sua curiosidade:

- **UTF-8:** compare bytes e caracteres em um texto com acentos. Se implementar contagem de caracteres, defina também como tratar sequências inválidas.
- **Bytes NUL:** investigue por que o byte `0x00` pode aparecer em uma entrada sem representar EOF. Para estender as regras de contagem a dados binários, trate-o como um byte comum, não como separador.
- **Limite dos contadores:** descubra a capacidade do tipo escolhido e como detectar estouro antes de incrementar. Teste perto do limite sem precisar gerar um arquivo gigantesco.
- **Falhas de entrada e saída:** investigue como distinguir EOF de erro de leitura e como detectar falhas de escrita, inclusive ao descarregar o buffer de saída. Defina diagnósticos em `stderr` e status de falha.

## 6. Perguntas para investigação

Durante a implementação, procure refletir sobre estas questões:

1. O que exatamente significa EOF? É um caractere como os outros?
2. Como identificar o início de uma nova palavra sem armazenar todas as palavras?
3. Qual é a diferença entre o número de bytes e o número de caracteres de um texto?
4. É possível processar um arquivo de vários gigabytes utilizando uma quantidade praticamente constante de memória?
5. O que muda quando a entrada vem de um arquivo, de um pipe ou diretamente do teclado?

## 7. Como participar

Implemente sua solução individualmente ou em dupla.

Compartilhe no Discord seu código (ou link para um repositório), um exemplo de execução e um breve comentário sobre algo que você aprendeu ou uma dificuldade que encontrou. Quando houver um tópico oficial vinculado a esta página, concentre a discussão nele.

**Você não precisa terminar para participar.** Uma dúvida, um caso de teste, uma descoberta de depuração ou uma implementação parcial já são contribuições úteis.

Você pode consultar documentação, livros, exemplos e discutir ideias com outros membros. O importante é conseguir compreender e explicar a implementação apresentada.

Esta página é a fonte canônica dos requisitos. Correções que afetem implementações existentes serão registradas aqui; o Discord é o espaço para conversar sobre elas.

---

**O objetivo do Oxide Club não é apenas fazer o código funcionar. É entender por que ele funciona.**

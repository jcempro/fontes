# Como Indicar URLs de Publicações

Use qualquer uma das formas abaixo. Um único formato já basta.

## Forma simples

```text
Livro: Caminho a Cristo
URL: https://exemplo.org/caminho-a-cristo.pdf
```

Também pode ser escrito assim:

```text
Caminho a Cristo -> https://exemplo.org/caminho-a-cristo.pdf
```

## Um livro com várias URLs

```text
Livro: Caminho a Cristo
URLs:
- https://exemplo.org/caminho-a-cristo.pdf
- https://exemplo.org/caminho-a-cristo.epub
```

Também é aceito:

```text
Caminho a Cristo:
https://exemplo.org/caminho-a-cristo.pdf
https://exemplo.org/caminho-a-cristo.epub
```

## Vários livros

```text
- Caminho a Cristo: https://exemplo.org/caminho-a-cristo.pdf
- O Grande Conflito: https://exemplo.org/o-grande-conflito.pdf
```

## Vários livros com várias URLs

```text
Caminho a Cristo:
- https://exemplo.org/caminho-a-cristo.pdf
- https://exemplo.org/caminho-a-cristo.epub

O Grande Conflito:
- https://exemplo.org/o-grande-conflito.pdf
- https://exemplo.org/o-grande-conflito.epub
```

## JSON opcional

Para incluir dados formativos do livro e hashes globais em JSON, siga a [Norma de Dados Formativos para Sugestão de Livro](norma-sugestao-inclusao-livro.md).

```json
{
  "publications": [
    {
      "title": "Caminho a Cristo",
      "urls": [
        "https://exemplo.org/caminho-a-cristo.pdf",
        "https://exemplo.org/caminho-a-cristo.epub"
      ]
    }
  ]
}
```

## YAML opcional

Para incluir dados formativos do livro e hashes globais em YAML, siga a [Norma de Dados Formativos para Sugestão de Livro](norma-sugestao-inclusao-livro.md).

```yaml
publications:
  - title: Caminho a Cristo
    urls:
      - https://exemplo.org/caminho-a-cristo.pdf
      - https://exemplo.org/caminho-a-cristo.epub
```

## Observações

Erros simples de escrita, pontuação, plural, maiúsculas, Markdown ou indentação serão tolerados quando a relação entre publicação e URL continuar clara.

Quando souber, inclua título, idioma, formato, URL e fonte institucional. URLs de páginas ou índices com várias publicações também podem ser indicadas.

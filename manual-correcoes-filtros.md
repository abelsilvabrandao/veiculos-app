# Manual para Correção do Erro "data is not defined" em js/gate.js

## Problema
O erro ocorre porque dentro da função `filterVehicles` no arquivo `js/gate.js`, a variável `data` está sendo usada, mas não está definida no escopo da função. O correto é usar a variável `vehicle`, que representa o item atual do loop.

## Passo a Passo para Correção Manual

1. Abra o arquivo `js/gate.js`.

2. Localize a função `filterVehicles`. Ela começa aproximadamente na linha 153.

3. Dentro dessa função, encontre o trecho onde a variável `showSuccess` é definida. Deve ser algo parecido com:

```js
const showSuccess = (!!data.docPhoto || !data.documentPhotoRequested) &&
                    (!!data.vehiclePhoto || !data.vehiclePhotoRequested) &&
                    (data.docPhoto || data.vehiclePhoto);
```

4. Substitua todas as ocorrências de `data` por `vehicle` nesse trecho, ficando assim:

```js
const showSuccess = (!!vehicle.docPhoto || !vehicle.documentPhotoRequested) &&
                    (!!vehicle.vehiclePhoto || !vehicle.vehiclePhotoRequested) &&
                    (vehicle.docPhoto || vehicle.vehiclePhoto);
```

5. Salve o arquivo.

6. Recarregue a página no navegador e teste os filtros para verificar se o erro foi corrigido.

## Explicação

- A variável `vehicle` é o objeto que representa o veículo atual no loop `currentVehicles.forEach(vehicle => { ... })`.
- A variável `data` não existe nesse contexto, por isso o erro de referência.
- Corrigindo para `vehicle`, o código acessa corretamente as propriedades do objeto atual.

---

Se precisar, posso ajudar a revisar o código para outras possíveis melhorias ou erros.

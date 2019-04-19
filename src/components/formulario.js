/**
 * Importação do React e dos componentes do Reactstrap
 * O reactstrap é uma biblioteca de componentes do react que adiciona o Bootstrap ao react
 */
import React from 'react';
import { Button, Form, InputGroupAddon, InputGroup,  Input} from 'reactstrap';

/**
 * Criação do componente formulário para ser exibido na aplicação
 */
const Formulario = ({carregar, resetar}) => {
    return (
        <div>
            {
                /**
                 * Informando ao Form que ao realizar o submit dos dados, deve ser invocado o método carregar do componente App
                 * que aqui é recebido como props e deve ser enviado no arquivo APP.js
                 */
            }
            <Form onSubmit={carregar}>
            
            <hr/>
            <h3 className="text-muted">Please insert here the resource you want to search:</h3>
            
             <InputGroup>
                <InputGroupAddon addonType="prepend">http://dbpedia.org/resource/</InputGroupAddon>
                    <Input placeholder="Sujeito" name='sujeito' defaultValue="Disownment"/>
                <InputGroupAddon addonType="append"><Button color="primary">Load</Button><Button color="secondary" onClick={resetar}>Clear</Button></InputGroupAddon>
            </InputGroup>

            </Form>
        </div>
    );
}

export default Formulario;
import React from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';

class ModalEdge extends React.Component {

  render() {
    let {modal, toggle,  salvar, editingEdge} = this.props;
    
    return (
      <div>
        <Modal isOpen={modal} toggle={toggle}>
            <Form onSubmit={salvar}>
                <ModalHeader toggle={toggle}>Edge Specifications</ModalHeader>
                <ModalBody>
                    <input type="hidden" id="id" name="id" defaultValue={editingEdge.id} />
                    <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                        <Label for="label">Label: </Label>
                        <Input type="text" name="label" id="label" placeholder="Edge Name" defaultValue={editingEdge.label} />
                    </FormGroup>
                    <br/>

                    
                    <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                        <Label for="align">Align: </Label>
                        <Input type="select" name="align" id="align" defaultValue={editingEdge.align}>
                            <option value='top'>Top</option> 
                            <option value='middle'>Middle</option> 
                            <option value='bottom'>Bottom</option>
                        </Input>
                    </FormGroup>
                    <br/>
                   
                </ModalBody>
                <ModalFooter>
                   
                    <Button color='primary'>Edit</Button>{' '}
                    <Button color="secondary" onClick={toggle}>Cancel</Button>
                </ModalFooter>
            </Form>
        </Modal>
      </div>
    );
  }
}

export default ModalEdge;
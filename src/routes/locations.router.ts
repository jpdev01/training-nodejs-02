import { response, Router } from 'express';
import knex from '../database/connection';

const locationsRouter = Router();

locationsRouter.post('/', async (request, response) => {
    const { 
        name, 
        email,
        whatsapp,
        latitude,
        longitude,
        city,
        uf,
        items
    } = request.body;

    const location = {
        image: 'fake-image.png',
        name, 
        email,
        whatsapp,
        latitude,
        longitude,
        city,
        uf,
        items
    }


    /*
    * ABRE TRANSAÇÃO
    * tudo abaixo estará na mesma transação. se der erro em um, fará rollback em tudo.
    */
    const transaction = await knex.transaction();
    const newIds = await transaction('locations').insert(location);

    const location_id = newIds[0];

    // as tabelas dependentes
    const locationItems = items.map(async (item_id: number) => {
        const selectedItem = await transaction('items').where('id', item_id).first();
        if(!selectedItem) {
            return response.status(400).json("Item" + item_id + " not found");
        }
        return {
            item_id,
            location_id
        }
    });
    await transaction('location_items').insert(locationItems);

    /*
    * Persiste no banco.
    */
    await transaction.commit();

    return response.json({
        id: location_id,
        // esses tres pontos fazem trazer todos os atributos de location. spred iterator
        ...location
    })

});

locationsRouter.get('/:id', async (request, response) => {
    const { id } = request.params;

    const location = await knex('locations').where('id', id).first();

    if(!location){
        return response.status(400).json("location " + id + " not found.");
    }

    return response.json(location);
});

export default locationsRouter;
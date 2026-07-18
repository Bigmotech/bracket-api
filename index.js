const express = require('express');
const cors = require('cors');

const { BracketsManager } = require('brackets-manager');
const { JsonDatabase } = require('brackets-json-db');

const app = express();

app.use(cors());
app.use(express.json());

const storage = new JsonDatabase();
const manager = new BracketsManager(storage);

app.post('/api/create', async (req, res) => {
    try {
        const { name, tournamentId, type, seeding, settings } = req.body;
        await manager.get.currentStage(tournamentId).then(value =>{
            if(value === null)
                res.json("Tournament with that ID already exist");
        })

        await manager.create.stage({
            tournamentId: tournamentId,
            name: name,
            type: type,
            seeding: seeding,
            settings: settings,
        });


        res.json(`Create ${name} with ID ${tournamentId}`);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message,
        });
    }
});

app.get('/api/bracket/:id', async (req, res) => {
    try {

        const id = Number.parseInt(req.params.id);
        await manager.get.currentStage(id).then(async value => {
            let data = await manager.get.stageData(value.id)
            res.json(data)

        })
        // const data = await manager.get.stageData(0)
        // res.json(data);
    } catch (err) {
        res.status(500).json({
            error: err.message,
        });
    }
});

app.put('/api/update', async (req, res)=>{
    const { id, group, round, matchNumber, team1, team2 } = req.body;
    
    let groupOffset = Number.parseInt(group) - 1;
    let roundOffset = round - 1;
    let stage = await manager.get.currentStage(id);
    let values = await manager.get.stageData(stage.id);
    
    let winnerBracketOffset = values.round.filter(round => round.group_id == 0).length

    if(group > 0)
        roundOffset += winnerBracketOffset

    let data = (await manager.get.stageData(stage.id)).match.find(match => {
        return match.group_id == groupOffset && match.number == matchNumber && match.round_id == roundOffset

    })
    manager.update.match({

        id: data.id,
        opponent1: { result: team1>team2 ? 'win' : 'loss'},
        opponent2: { result: team2>team1 ? 'win' : 'loss'}
    })
    res.json(manager.get.currentStage(0))

})

app.post('/api/clear', async (req,res)=>{
    await storage.reset();
    res.json('OK')

})

app.listen(3001, () => {
    console.log('Bracket server running on port 3001');
});
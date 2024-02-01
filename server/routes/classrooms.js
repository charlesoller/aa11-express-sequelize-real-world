// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Classroom, Supply, StudentClassroom } = require('../db/models');
const { Op } = require('sequelize');

// List of classrooms
router.get('/', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    // Phase 6B: Classroom Search Filters
    /*
        name filter:
            If the name query parameter exists, set the name query
                filter to find a similar match to the name query parameter.
            For example, if name query parameter is 'Ms.', then the
                query should match with classrooms whose name includes 'Ms.'

        studentLimit filter:
            If the studentLimit query parameter includes a comma
                And if the studentLimit query parameter is two numbers separated
                    by a comma, set the studentLimit query filter to be between
                    the first number (min) and the second number (max)
                But if the studentLimit query parameter is NOT two integers
                    separated by a comma, or if min is greater than max, add an
                    error message of 'Student Limit should be two integers:
                    min,max' to errorResult.errors
            If the studentLimit query parameter has no commas
                And if the studentLimit query parameter is a single integer, set
                    the studentLimit query parameter to equal the number
                But if the studentLimit query parameter is NOT an integer, add
                    an error message of 'Student Limit should be a integer' to
                    errorResult.errors
    */
    const where = {};

    const { name, studentLimit } = req.query;

    if (name) {
        where.name = {
            [Op.like]: `%${name}%`
        }
    }

    if (studentLimit.includes(',')) {
        const checkLimit = studentLimit.split(',');
        console.log(checkLimit)
        if (Number(checkLimit[0]) > Number(checkLimit[1]) ||
            checkLimit.length < 2) {
                console.log('TEST');
                errorResult.errors.push({message: "Student Limit should be two numbers: min,max"})
            } else {
                where.studentLimit = {
                    [Op.between]: [Number(checkLimit[0]), Number(checkLimit[1])]
            }
        }
    } else {
        if (studentLimit.typeOf)
        where.studentLimit = {
            [Op.lte]: Number(studentLimit)
        }
    }

    const classrooms = await Classroom.findAll({
        attributes: [ 'id', 'name', 'studentLimit' ],
        where,
        order: [['name']]
        // Phase 1B: Order the Classroom search results
    });
    if (errorResult.errors.length) {
        console.log(errorResult)
        res.status(400).json(errorResult);
    }
    res.json(classrooms);
});

// Single classroom
router.get('/:id', async (req, res, next) => {
    let classroom = await Classroom.findByPk(req.params.id, {
        attributes: ['id', 'name', 'studentLimit'],
        // Phase 7:
            // Include classroom supplies and order supplies by category then
                // name (both in ascending order)
            // Include students of the classroom and order students by lastName
                // then firstName (both in ascending order)
                // (Optional): No need to include the StudentClassrooms
        // Your code here
    });

    if (!classroom) {
        res.status(404);
        res.send({ message: 'Classroom Not Found' });
    }

    // Phase 5: Supply and Student counts, Overloaded classroom
        // Phase 5A: Find the number of supplies the classroom has and set it as
            // a property of supplyCount on the response
        // Phase 5B: Find the number of students in the classroom and set it as
            // a property of studentCount on the response
        // Phase 5C: Calculate if the classroom is overloaded by comparing the
            // studentLimit of the classroom to the number of students in the
            // classroom
        // Optional Phase 5D: Calculate the average grade of the classroom
    // Your code here

    // supplies are many to one to classroom
    // trying to find amt of supplies in one classroom thru id
    const { id } = req.params
    const supplies = await Supply.findAll({
        where: {
            classroomId: id
        },
        raw: true
    })
    const students = await StudentClassroom.findAll({
        attributes: ['grade'],
        where: {
            classroomId: id
        },
        raw: true
    })
    // const test = await supplies.count()
    // console.log(test)

    classroom = classroom.toJSON()
    classroom.supplyCount = supplies.length
    classroom.studentCount = students.length

    const avgGrade = students.reduce((acc, curr) => acc + curr.grade, 0) / students.length
    classroom.avgGrade = avgGrade

    if(classroom.studentCount > classroom.studentLimit){
        classroom.overloaded = true
    } else {
        classroom.overloaded = false
    }
    if (errorResult.errors.length) {
        console.log(errorResult)
        res.status(400).json(errorResult);
    }
    res.json(classroom);
});

// Export class - DO NOT MODIFY
module.exports = router;

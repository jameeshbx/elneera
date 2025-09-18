// app/api/manage-dmc/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { Prisma, DMCStatus } from "@prisma/client"



const prisma = new PrismaClient()

interface DMCRequest { 
  id: string
  name: string
  email: string
  phoneNumber: string
  dmcName: string
  status: 'ACTIVE' | 'DEACTIVE'
  requestStatus: 'Approved' | 'Pending' | 'Rejected' 
  requestDate: string
}

export async function GET(request: Request) {

   console.log(' API GET /api/auth/manage-DMC HIT');  

  try {
    const { searchParams } = new URL(request.url); 

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '8');

    // Search and filters
    const searchTerm = searchParams.get('search') || '';
    const statusFilterParam = searchParams.get('status')?.split(',') || ['ACTIVE', 'DEACTIVE']
    const statusFilter: DMCStatus[] = statusFilterParam.map(
    (status) => status as DMCStatus 
)


    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Base query conditions
    const whereConditions: Prisma.DMCFormWhereInput = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { contactPerson: { contains: searchTerm, mode: 'insensitive' } },
        { phoneNumber: { contains: searchTerm, mode: 'insensitive' } },
      ],
      status: { in: statusFilter },
    };

    if (dateFrom && dateTo) {
      whereConditions.createdAt = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      };
    }


    // Get total count
    const totalCount = await prisma.dMCForm.count({ where: whereConditions });

    // Fetch DMC forms with their request status (use only include, not select)
    const dmcForms = await prisma.dMCForm.findMany({
      where: whereConditions,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
//       include: {
//         requestStatus: true,
// },

    });


    // Transform data
    const transformedData: DMCRequest[] = dmcForms.map(form => ({
      
      id: form.id,
      name: form.contactPerson || 'N/A',
      email: form.email || 'N/A',
      phoneNumber: `${form.phoneCountryCode || ''} ${form.phoneNumber || ''}`.trim(),
      dmcName: form.name,
      status: form.status,
     requestStatus: 'Pending',  // or whatever default makes sense

      requestDate: form.createdAt.toISOString(),                   
    }));


    return NextResponse.json({
      success: true,
      data: transformedData,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching DMC forms:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },    
      { status: 500 }
    );
  }
}


export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Missing ID' },
        { status: 400 }
      )
    }

    
    // Prepare update operations
    const updates = []

    if (status !== undefined) {
      updates.push(
        prisma.dMCForm.update({
          where: { id },
          data: { status }
        })
      )
    }

    // If 'requestStatus' is not a valid field in your Prisma schema, remove this block.
    // Otherwise, update 'requestStatus' in the related model or handle it appropriately.
    // Example: If 'dmcRequestStatus' is a related model, update it like this:
    /*
    if (requestStatus !== undefined) {
      updates.push(
        prisma.dmcRequestStatus.update({
          where: { dmcFormId: id },
          data: { status: requestStatus }
        })
      )
    }
    */


    // Execute all updates
    await Promise.all(updates)

    return NextResponse.json({                           
      success: true,
      message: 'Status updated successfully'
    })

  } catch (error) {
    console.error('Error updating DMC status:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
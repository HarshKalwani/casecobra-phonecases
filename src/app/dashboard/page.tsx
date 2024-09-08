import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { notFound, redirect } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusDropdown from "./StatusDropdown";

const Page = async() => {

    const {getUser} = getKindeServerSession()

    const user = await getUser();
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL

    if(!user || user.email !== ADMIN_EMAIL){
        return notFound();
        // redirect('/') or we can redirect to directly home page
    }

    const orders = await db.order.findMany({
        where:{
            isPaid:true,
            createdAt:{
                gte:new Date(new Date().setDate(new Date().getDate() -7))
            }
        },
        orderBy:{
            createdAt:'desc',
        },
        include:{
            user:true,
            ShppingAddress:true,

        }
    })

    const lastWeekSum = await db.order.aggregate({
        where:{
            isPaid:true,
            createdAt:{
                gte:new Date(new Date().setDate(new Date().getDate() -7))
            },
        },
        _sum:{
            amount:true,
        }
    })

    const lastMonthSum = await db.order.aggregate({
        where:{
            isPaid:true,
            createdAt:{
                gte:new Date(new Date().setDate(new Date().getDate() -30))
            },
        },
        _sum:{
            amount:true,
        }
    })

    const WEEKLY_GOAL = 5000
    const MONTHLY_GOAL = 50000
    return(
        <div className="flex min-h-screen w-full bg-muted/40">
            <div className="max-w-7xl w-full mx-auto flex flex-col sm:gap-4 sm:py-4">
                <div className="flex flex-col gap-16">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Last Week </CardDescription>
                                <CardTitle className="text-4xl">
                                    {formatPrice(lastWeekSum._sum.amount ?? 0)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    of {formatPrice(WEEKLY_GOAL)} goal
                                </div>

                            </CardContent>
                            <CardFooter>
                                <Progress value={((lastWeekSum._sum.amount ?? 0) *100) / WEEKLY_GOAL}/>
                            </CardFooter>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Last Month </CardDescription>
                                <CardTitle className="text-4xl">
                                    {formatPrice(lastMonthSum._sum.amount ?? 0)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    of {formatPrice(MONTHLY_GOAL)} goal
                                </div>

                            </CardContent>
                            <CardFooter>
                                <Progress value={((lastMonthSum._sum.amount ?? 0) *100) / MONTHLY_GOAL}/>
                            </CardFooter>
                        </Card>
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight">
                        Incoming orders
                    </h1>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead className="hidden sm:table-cell">Status</TableHead>
                                <TableHead className="hidden sm:table-cell">Purchase Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>

                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id} className="bg-accent">
                                        <TableCell>
                                            <div className="font-medium">
                                                {order.ShppingAddress?.name}
                                            </div>

                                            <div className="hidden text-sm text-muted-foreground md:inline">
                                                {order.user.email}
                                            </div>
                                        </TableCell>

                                        <TableCell className="hidden sm:table-cell">
                                            <StatusDropdown id={order.id} orderStatus={order.status}/>
                                        </TableCell>

                                        <TableCell className="hidden md:table-cell">{order.createdAt.toLocaleDateString()}</TableCell>

                                        <TableCell className="text-right">
                                            {formatPrice(order.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </TableHeader>
                    </Table>
                </div>
            </div>
        </div>
    )
}
export default Page